import 'dotenv/config';

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  anthropicApiKey: required('ANTHROPIC_API_KEY'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
