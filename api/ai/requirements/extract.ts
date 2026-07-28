import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractFormFields } from '../../_lib/ai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { messages, fields, currentValues } = req.body;
  const result = await extractFormFields({ messages, fields, currentValues });
  res.status(200).json(result);
}
