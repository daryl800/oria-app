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

        const upgradeUser = async (uid: string) => {
          const { error } = await supabaseAdmin
            .from('users')
            .update({ plan: 'plus' })
            .eq('id', uid);
          if (error) console.error(`[billing] plan upgrade failed for ${uid}:`, error.message);
          else console.log(`[billing] plan upgraded to plus for user ${uid}`);

          if (customerId) {
            const { error: cidErr } = await supabaseAdmin
              .from('users')
              .update({ stripe_customer_id: customerId })
              .eq('id', uid);
            if (cidErr) console.warn(`[billing] stripe_customer_id update failed (column may not exist yet):`, cidErr.message);
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

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        // Downgrade — relies on stripe_customer_id column existing
        await supabaseAdmin
          .from('users')
          .update({ plan: 'free' })
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

// ─── Session-status endpoint (auth-protected, registered in apiRouter) ────────

const billingRouter = Router();

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

export default billingRouter;
