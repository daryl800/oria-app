import { Router, type Request, type Response } from 'express';

const router = Router();
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL ?? 'http://localhost:5002';

// POST /api/timezone/lookup
router.post('/lookup', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const result = await fetch(`${ANALYSIS_SERVICE_URL}/timezone/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });
    if (!result.ok) throw new Error('Timezone lookup failed');
    const data = await result.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
