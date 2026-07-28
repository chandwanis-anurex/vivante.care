import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { registerAiRoutes } from './modules/ai/ai.routes.js';
import { registerRequirementsRoutes } from './routes/requirements.routes.js';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.corsOrigin });

  app.get('/health', async () => ({ status: 'ok' }));

  await registerAiRoutes(app);
  await registerRequirementsRoutes(app);

  await app.listen({ port: env.port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
