import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

interface Requirement {
  id: string;
  title: string;
  specialty: string;
  location: string;
  shiftType: string;
  notes?: string;
  openedAt: string;
  archived: boolean;
}

// In-memory store for prototype purposes. Swap for a real DB (e.g.
// DynamoDB/Postgres on AWS) — the route handlers below are the seam.
const requirements: Requirement[] = [];

interface CreateBody {
  title: string;
  specialty: string;
  location: string;
  shiftType: string;
  notes?: string;
}

export async function registerRequirementsRoutes(app: FastifyInstance) {
  app.get('/api/requirements', async () => {
    return requirements;
  });

  app.post<{ Body: CreateBody }>('/api/requirements', async (request, reply) => {
    const requirement: Requirement = {
      id: randomUUID(),
      openedAt: new Date().toISOString(),
      archived: false,
      ...request.body,
    };
    requirements.push(requirement);
    // TODO: enqueue for the next matching engine run (runs every 12h).
    reply.code(201).send(requirement);
  });

  app.patch<{ Params: { id: string }; Body: Partial<Requirement> }>(
    '/api/requirements/:id',
    async (request, reply) => {
      const req = requirements.find((r) => r.id === request.params.id);
      if (!req) return reply.code(404).send({ error: 'Requirement not found' });
      Object.assign(req, request.body);
      reply.send(req);
    }
  );
}
