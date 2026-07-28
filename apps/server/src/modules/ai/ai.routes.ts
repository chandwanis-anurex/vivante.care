import type { FastifyInstance } from 'fastify';
import {
  streamAnalysis,
  extractFormFields,
  extractScheduleRules,
  type ChatTurn,
  type ScheduleRuleLike,
} from './ai.service.js';

interface ExtractBody {
  messages: ChatTurn[];
  fields: string[];
  currentValues: Record<string, string>;
}

interface ScheduleExtractBody {
  messages: ChatTurn[];
  existingRules: ScheduleRuleLike[];
  context?: string;
}

interface AnalyzeBody {
  prompt: string;
}

export async function registerAiRoutes(app: FastifyInstance) {
  // Streaming SSE analytics endpoint (VivanteIQ free-form questions, etc.)
  app.post<{ Body: AnalyzeBody }>('/api/ai/analyze/stream', async (request, reply) => {
    const { prompt } = request.body;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      for await (const delta of streamAnalysis(prompt)) {
        reply.raw.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
      }
      reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (err) {
      reply.raw.write(
        `data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`
      );
    } finally {
      reply.raw.end();
    }
  });

  // Shared handler factory for the chat-fills-form pattern used by both
  // Requirements intake and VivantePassport creation on the frontend.
  const extractHandler = async (
    request: { body: ExtractBody },
    reply: { send: (payload: unknown) => void }
  ) => {
    const { messages, fields, currentValues } = request.body;
    const result = await extractFormFields({ messages, fields, currentValues });
    reply.send(result);
  };

  app.post<{ Body: ExtractBody }>('/api/ai/requirements/extract', extractHandler);
  app.post<{ Body: ExtractBody }>('/api/ai/passport/extract', extractHandler);
  // Shift creation intake reuses the same flat-field extraction as
  // requirements/passport (title, specialty, location, notes) — the
  // "when" (recurrence) is handled separately by /api/ai/schedule/extract.
  app.post<{ Body: ExtractBody }>('/api/ai/shifts/extract', extractHandler);

  // Shared by VivantePassport availability and org shift-demand scheduling
  // — both are "recurring or one-off time window" descriptions.
  app.post<{ Body: ScheduleExtractBody }>('/api/ai/schedule/extract', async (request, reply) => {
    const { messages, existingRules, context } = request.body;
    const result = await extractScheduleRules({ messages, existingRules, context });
    reply.send(result);
  });
}
