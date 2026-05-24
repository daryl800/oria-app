import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-04-30.basil',
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Webhook handler (raw body — registered in server.ts before express.json) ─

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const isPaid =
          session.payment_status === 'paid' || session.mode === 'subscription';
        console.log(`[billing] checkout.session.completed payment_status=${session.payment_status} mode=${session.mode} client_reference_id=${session.client_reference_id}`);
        if (!isPaid) { console.log('[billing] not paid, skipping'); break; }

        const userId = session.client_reference_id;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        // Fetch subscription period_end if this is a subscription
        let planExpiresAt: string | null = null;
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            planExpiresAt = new Date(sub.current_period_end * 1000).toISOString();
          } catch (e: any) {
            console.warn('[billing] could not retrieve subscription:', e.message);
          }
        }

        const upgradeUser = async (uid: string) => {
          const { error } = await supabaseAdmin
            .from('users')
            .update({ plan: 'plus', plan_cancel_scheduled: false, plan_expires_at: planExpiresAt })
            .eq('id', uid);
          if (error) console.error(`[billing] plan upgrade failed for ${uid}:`, error.message);
          else console.log(`[billing] plan upgraded to plus for user ${uid}, expires=${planExpiresAt}`);

          if (customerId) {
            const { error: cidErr } = await supabaseAdmin
              .from('users')
              .update({ stripe_customer_id: customerId })
              .eq('id', uid);
            if (cidErr) console.warn(`[billing] stripe_customer_id update failed:`, cidErr.message);
          }

          if (subscriptionId) {
            const { error: sidErr } = await supabaseAdmin
              .from('users')
              .update({ stripe_subscription_id: subscriptionId })
              .eq('id', uid);
            if (sidErr) console.warn(`[billing] stripe_subscription_id update failed:`, sidErr.message);
          }
        };

        if (userId) {
          await upgradeUser(userId);
        } else if (session.customer_details?.email) {
          console.log(`[billing] no client_reference_id, falling back to email: ${session.customer_details.email}`);
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const authUser = users.find(u => u.email === session.customer_details?.email);
          if (authUser) await upgradeUser(authUser.id);
          else console.error(`[billing] no user found for email ${session.customer_details.email}`);
        } else {
          console.error('[billing] no client_reference_id and no email — cannot identify user');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const planExpiresAt = new Date(sub.current_period_end * 1000).toISOString();
        const cancelScheduled = sub.cancel_at_period_end;
        console.log(`[billing] subscription.updated customer=${customerId} cancel_at_period_end=${cancelScheduled} expires=${planExpiresAt}`);
        await supabaseAdmin
          .from('users')
          .update({ plan_expires_at: planExpiresAt, plan_cancel_scheduled: cancelScheduled })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        console.log(`[billing] subscription.deleted customer=${customerId} — downgrading to free`);
        await supabaseAdmin
          .from('users')
          .update({ plan: 'free', plan_cancel_scheduled: false, plan_expires_at: null, stripe_subscription_id: null })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        break;
    }

    return res.json({ received: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// ─── Auth-protected billing endpoints ────────────────────────────────────────

const billingRouter = Router();

// GET /billing/session-status?session_id=xxx
billingRouter.get('/session-status', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) return res.status(400).json({ error: 'session_id required' });

    const userId = (req as any).userId;

    const [session, { data: userData }] = await Promise.all([
      stripe.checkout.sessions.retrieve(sessionId),
      supabaseAdmin.from('users').select('plan').eq('id', userId).single(),
    ]);

    return res.json({
      status: session.payment_status,
      plan: userData?.plan ?? 'free',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /billing/status — current subscription status for the logged-in user
billingRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('plan, plan_expires_at, plan_cancel_scheduled, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found' });

    // If we have a live subscription, sync current_period_end from Stripe
    if (user.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        const planExpiresAt = new Date(sub.current_period_end * 1000).toISOString();
        const cancelScheduled = sub.cancel_at_period_end;
        if (planExpiresAt !== user.plan_expires_at || cancelScheduled !== user.plan_cancel_scheduled) {
          await supabaseAdmin
            .from('users')
            .update({ plan_expires_at: planExpiresAt, plan_cancel_scheduled: cancelScheduled })
            .eq('id', userId);
          user.plan_expires_at = planExpiresAt;
          user.plan_cancel_scheduled = cancelScheduled;
        }
      } catch {
        // non-fatal — return cached DB values
      }
    }

    return res.json({
      plan: user.plan ?? 'free',
      plan_expires_at: user.plan_expires_at ?? null,
      plan_cancel_scheduled: user.plan_cancel_scheduled ?? false,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /billing/cancel — schedule cancellation at end of current period
billingRouter.post('/cancel', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const sub = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const planExpiresAt = new Date(sub.current_period_end * 1000).toISOString();
    await supabaseAdmin
      .from('users')
      .update({ plan_expires_at: planExpiresAt, plan_cancel_scheduled: true })
      .eq('id', userId);

    console.log(`[billing] cancellation scheduled for user ${userId}, expires=${planExpiresAt}`);
    return res.json({ plan_expires_at: planExpiresAt, plan_cancel_scheduled: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /billing/reactivate — undo cancel_at_period_end
billingRouter.post('/reactivate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const sub = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    const planExpiresAt = new Date(sub.current_period_end * 1000).toISOString();
    await supabaseAdmin
      .from('users')
      .update({ plan_expires_at: planExpiresAt, plan_cancel_scheduled: false })
      .eq('id', userId);

    console.log(`[billing] reactivated subscription for user ${userId}, next renewal=${planExpiresAt}`);
    return res.json({ plan_expires_at: planExpiresAt, plan_cancel_scheduled: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /billing/account — permanently delete account and all associated data
billingRouter.delete('/account', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  console.log(`[billing] account deletion requested for user ${userId}`);

  try {
    // 1. Cancel any active Stripe subscription immediately (no refund)
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userRow?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(userRow.stripe_subscription_id);
        console.log(`[billing] Stripe subscription ${userRow.stripe_subscription_id} cancelled for deleted account`);
      } catch (e: any) {
        // Non-fatal — subscription may already be cancelled or expired
        console.warn(`[billing] could not cancel Stripe subscription during deletion:`, e.message);
      }
    }

    // 2. Delete user data in dependency order
    await supabaseAdmin.from('messages').delete().eq('user_id', userId);
    await supabaseAdmin.from('conversation_summaries').delete().eq('user_id', userId);
    await supabaseAdmin.from('conversations').delete().eq('user_id', userId);
    await supabaseAdmin.from('daily_guidance').delete().eq('user_id', userId);
    await supabaseAdmin.from('bazi_profile_versions').delete().eq('user_id', userId);
    await supabaseAdmin.from('mbti_profile_versions').delete().eq('user_id', userId);
    await supabaseAdmin.from('persons').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_profiles').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);

    // 3. Delete the Supabase auth user (must be last)
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error(`[billing] auth user deletion failed for ${userId}:`, authErr.message);
      return res.status(500).json({ error: 'Account data deleted but auth removal failed. Please contact support.' });
    }

    console.log(`[billing] account fully deleted for user ${userId}`);
    return res.json({ deleted: true });
  } catch (err: any) {
    console.error(`[billing] account deletion error for ${userId}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default billingRouter;
