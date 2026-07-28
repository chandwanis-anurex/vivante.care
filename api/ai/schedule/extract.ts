import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractScheduleRules } from '../../_lib/ai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { messages, existingRules, context } = req.body;
  const result = await extractScheduleRules({ messages, existingRules, context });
  res.status(200).json(result);
}
