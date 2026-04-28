// apps/api/src/routes/persons.ts

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// ─── POST /api/persons ───────────────────────────────────────────────────────
// Free users: max 1 person. Pro users: unlimited.

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const isPro =
    req.user!.subscription_status === 'active' &&
    new Date(req.user!.current_period_end) > new Date();

  const { name, relationship, birth_date, birth_time, birth_location, mbti_type } = req.body;

  if (!name || !relationship || !birth_date) {
    return res.status(400).json({
      error: 'name, relationship, and birth_date are required.',
    });
  }

  // Free tier: enforce 1-person limit
  if (!isPro) {
    const { count, error: countError } = await supabase
      .from('persons')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting persons:', countError);
      return res.status(500).json({ error: 'Failed to check person limit.' });
    }

    if ((count ?? 0) >= 1) {
      return res.status(402).json({
        upgrade_required: true,
        message: 'Free accounts can save one person. Upgrade to Oria Pro to add more.',
      });
    }
  }

  const { data, error } = await supabase
    .from('persons')
    .insert({
      user_id: userId,
      name: name.trim(),
      relationship: relationship.trim(),
      birth_date,
      birth_time: birth_time ?? null,
      birth_location: birth_location?.trim() ?? null,
      mbti_type: mbti_type ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting person:', error);
    return res.status(500).json({ error: 'Failed to save person.' });
  }

  return res.status(201).json({ person: data });
});

// ─── GET /api/persons ────────────────────────────────────────────────────────

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const { data, error } = await supabase
    .from('persons')
    .select('id, name, relationship, birth_date, birth_time, birth_location, mbti_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching persons:', error);
    return res.status(500).json({ error: 'Failed to fetch persons.' });
  }

  return res.status(200).json({ persons: data });
});

// ─── DELETE /api/persons/:id ─────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const personId = req.params.id;

  const { data: existing, error: fetchError } = await supabase
    .from('persons')
    .select('id')
    .eq('id', personId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Person not found.' });
  }

  const { error: deleteError } = await supabase
    .from('persons')
    .delete()
    .eq('id', personId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting person:', deleteError);
    return res.status(500).json({ error: 'Failed to delete person.' });
  }

  return res.status(200).json({ success: true });
});

export default router;
