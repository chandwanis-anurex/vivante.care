import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';

export const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

// Model used for the free-form analytics chat (VivanteIQ "ask a question"
// style flows). Larger model, adaptive thinking left on by default.
export const ANALYSIS_MODEL = 'claude-opus-4-8';

// Model used for the chat-fills-form extraction flows (Requirements intake,
// VivantePassport creation). Optimized for low latency on every keystroke
// round-trip rather than deep reasoning.
export const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function* streamAnalysis(prompt: string) {
  const stream = anthropic.messages.stream({
    model: ANALYSIS_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

interface ExtractParams {
  messages: ChatTurn[];
  fields: string[];
  currentValues: Record<string, string>;
}

interface ExtractResult {
  reply: string;
  extracted: Record<string, string>;
}

/**
 * Asks Claude to (a) continue the conversation naturally and (b) extract
 * any of `fields` it can infer from the conversation so far, merged over
 * `currentValues`. Forces strict JSON output so the API route can parse
 * it directly into the frontend form state.
 */
export async function extractFormFields({
  messages,
  fields,
  currentValues,
}: ExtractParams): Promise<ExtractResult> {
  const system = `You are the VivanteCare intake assistant. You are having a short conversation to help someone fill out a form with these fields: ${fields.join(', ')}.

Current known values (JSON): ${JSON.stringify(currentValues)}

Respond with ONLY a JSON object, no markdown fences, no preamble, matching exactly this shape:
{"reply": "<one short conversational sentence, ask about the next missing field if any>", "extracted": {"<field key>": "<value>", ...}}

Only include a field in "extracted" if you can confidently infer it from the conversation. Never invent values for fields the person hasn't mentioned or implied. Keep "reply" brief and friendly.`;

  const response = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 400,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '{}';

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as ExtractResult;
    return {
      reply: parsed.reply ?? "Got it — anything else you'd like to add?",
      extracted: parsed.extracted ?? {},
    };
  } catch {
    return {
      reply: "I heard you, but I'm having trouble parsing that — could you rephrase?",
      extracted: {},
    };
  }
}

export interface ScheduleRuleLike {
  id: string;
  kind: 'available' | 'occupied';
  daysOfWeek: number[] | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  label: string;
}

interface ExtractScheduleParams {
  messages: ChatTurn[];
  existingRules: ScheduleRuleLike[];
  context?: string;
}

interface ExtractScheduleResult {
  reply: string;
  rules: ScheduleRuleLike[];
}

/**
 * Shared by VivantePassport availability (worker side) and shift-demand
 * scheduling (org side) — both are "recurring or one-off time window"
 * descriptions, just with different `context` framing in the prompt.
 * Unlike extractFormFields (flat key/value merge), the model returns the
 * FULL updated rule list each turn since rules can be added, refined, or
 * removed based on conversation, not just filled in.
 */
export async function extractScheduleRules({
  messages,
  existingRules,
  context,
}: ExtractScheduleParams): Promise<ExtractScheduleResult> {
  const today = new Date().toISOString().slice(0, 10);
  const system = `You are the VivanteCare scheduling assistant. You're helping build a list of recurring or one-off time-window rules for ${context ?? 'a healthcare schedule'}.

Each rule has exactly this shape:
{"id": "<reuse the existing id if you're keeping/refining a rule, otherwise invent a short new id>", "kind": "available" | "occupied", "daysOfWeek": [0-6] or null (0=Sunday..6=Saturday; null means every day in the date range), "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" (inclusive; equal to startDate for a single day), "startTime": "HH:mm" or null, "endTime": "HH:mm" or null (null means all day), "label": "<short human-readable summary, e.g. 'Weekends, 7am-7pm, Aug-Dec'>"}

Today's date is ${today} — resolve relative dates ("next month", "in August") against it. If no end is given for an open-ended recurring pattern, default to 6 months out.

Current rules (JSON): ${JSON.stringify(existingRules)}

Respond with ONLY a JSON object, no markdown fences, no preamble, matching exactly this shape:
{"reply": "<one short conversational sentence>", "rules": [<the FULL updated list of rules after applying what the person just said — keep unaffected prior rules as-is, update ones they refined, drop ones they said no longer apply, add new ones>]}

Never invent a rule the person hasn't stated or implied. Keep "reply" brief and friendly.`;

  const response = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 800,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '{}';

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as ExtractScheduleResult;
    return {
      reply: parsed.reply ?? "Got it — anything else you'd like to add?",
      rules: parsed.rules ?? existingRules,
    };
  } catch {
    return {
      reply: "I heard you, but I'm having trouble parsing that — could you rephrase?",
      rules: existingRules,
    };
  }
}
