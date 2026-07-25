/* eslint-disable */
// @ts-nocheck
import { Router, Request, Response } from 'express';
import { completeTracked } from '../lib/llm';
import {
  eastR1Prompt, westR1Prompt,
  eastR2Prompt, westR2Prompt,
  eastR3Prompt, westR3Prompt,
  eastR4Prompt, westR4Prompt,
  synthesisPrompt,
} from '../lib/debatePrompts';

const router = Router();

function getEastChain() { return 'debate_east_hunyuan'; }
function getWestChain() { return 'debate_west_openai'; }

function formatAllRounds(rounds: any[]): string {
  return rounds.map((r) => {
    if (r.synthesis) return `【第五輪·綜合】\n${r.synthesis}`;
    return `【第${r.round}輪】\n🏮 東方智者：\n${r.east}\n\n🧠 西方顧問：\n${r.west}`;
  }).join('\n\n---\n\n');
}

// POST /api/debate/demo/start — no auth, no DB save
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { question, lang = 'zh-TW' } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const [
      { text: eastR1, model: eastModelName },
      { text: westR1, model: westModelName },
    ] = await Promise.all([
      completeTracked(eastR1Prompt(null, null, question, '', null, lang), getEastChain()),
      completeTracked(westR1Prompt(null, null, question, '', null, lang), getWestChain()),
    ]);

    return res.json({
      east: eastR1,
      eastModel: eastModelName,
      west: westR1,
      westModel: westModelName,
      complete: false,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/debate/demo/next — no auth, stateless (client sends all previous rounds)
router.post('/next', async (req: Request, res: Response) => {
  try {
    const { question, lang = 'zh-TW', rounds = [] } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const currentRound = rounds.length;
    const nextRound = currentRound + 1;

    if (nextRound < 2 || nextRound > 5) {
      return res.status(400).json({ error: `Invalid next round: ${nextRound}` });
    }

    let newRoundData: any;
    let isComplete = false;

    if (nextRound === 2) {
      const [
        { text: eastR2, model: eastModelName },
        { text: westR2, model: westModelName },
      ] = await Promise.all([
        completeTracked(eastR2Prompt(null, null, question, '', rounds[0].west, rounds[0].east, null, lang), getEastChain()),
        completeTracked(westR2Prompt(null, null, question, '', rounds[0].east, rounds[0].west, null, lang), getWestChain()),
      ]);
      newRoundData = { round: 2, east: eastR2, eastModel: eastModelName, west: westR2, westModel: westModelName };

    } else if (nextRound === 3) {
      const [
        { text: eastR3, model: eastModelName },
        { text: westR3, model: westModelName },
      ] = await Promise.all([
        completeTracked(eastR3Prompt(null, null, question, '', rounds[1].west, rounds[1].east, null, lang), getEastChain()),
        completeTracked(westR3Prompt(null, null, question, '', rounds[1].east, rounds[1].west, null, lang), getWestChain()),
      ]);
      newRoundData = { round: 3, east: eastR3, eastModel: eastModelName, west: westR3, westModel: westModelName };

    } else if (nextRound === 4) {
      const [
        { text: eastR4, model: eastModelName },
        { text: westR4, model: westModelName },
      ] = await Promise.all([
        completeTracked(eastR4Prompt(null, null, question, '', rounds[2].west, rounds[2].east, null, lang), getEastChain()),
        completeTracked(westR4Prompt(null, null, question, '', rounds[2].east, rounds[2].west, null, lang), getWestChain()),
      ]);
      newRoundData = { round: 4, east: eastR4, eastModel: eastModelName, west: westR4, westModel: westModelName };

    } else if (nextRound === 5) {
      const { text: synthesis, model: synthesisModelName } = await completeTracked(
        synthesisPrompt(null, null, question, '', formatAllRounds(rounds), null, lang),
        'debate_synthesis',
      );
      newRoundData = { round: 5, synthesis, synthesisModel: synthesisModelName };
      isComplete = true;
    }

    return res.json({
      round: nextRound,
      ...newRoundData,
      complete: isComplete,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
