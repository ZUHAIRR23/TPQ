import { runSupabaseKeepAlive } from '../scripts/supabase-keepalive.mjs';

const runtimeEnv = globalThis?.process?.env ?? {};

const json = (status, payload) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

export default async function handler(req) {
  const cronSecret = runtimeEnv.CRON_SECRET;
  const authHeader = req.headers?.authorization || req.headers?.Authorization;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }

  const result = await runSupabaseKeepAlive({ env: runtimeEnv, fetchImpl: fetch });
  return json(result.status, result.payload);
}
