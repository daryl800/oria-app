// apps/api/src/routes/persons.ts

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

function isPlusUser(userData: any): boolean {
    const plan = String(userData?.plan ?? '').toLowerCase();
    return plan === 'plus';
}

// ─── POST /api/persons ───────────────────────────────────────────────────────
// Create a new person
// Free users: max 1 person
// Pro users: unlimited

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    // Load plan from DB
    const { data: userData } = await supabase
      .from('users')
      .select('plan, pro_expires_at')
      .eq('id', userId)
      .single();

    const isPro = isPlusUser(userData);

    const { name, relationship, birth_date, birth_time, birth_location, mbti_type } = req.body;

    // Validate required fields
    if (!name || !relationship || !birth_date) {
        return res.status(400).json({
            error: 'name, relationship, and birth_date are required.'
        });
    }

    // Free tier: check person count
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
                message: 'Free accounts can save one person. Upgrade to oria Plus to add more.'
            });
        }
    }

    // Insert person
    const { data, error } = await supabase
        .from('persons')
        .insert({
            user_id: userId,
            name: name.trim(),
            relationship: relationship.trim(),
            birth_date,
            birth_time: birth_time ?? null,
            birth_location: birth_location?.trim() ?? null,
            mbti_type: mbti_type ?? null
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
// List all persons for the authenticated user

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

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
// Delete a person — only if it belongs to the authenticated user

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const personId = req.params.id;

    // RLS will enforce ownership, but we check explicitly for a clear 404
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
