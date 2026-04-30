import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const getEnv = (env, ...keys) => {
  const key = keys.find((name) => env[name]);
  return key ? env[key] : undefined;
};

export async function runSupabaseKeepAlive({
  env = globalThis?.process?.env ?? {},
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!fetchImpl) {
    return {
      status: 500,
      payload: { ok: false, error: 'Fetch API tidak tersedia di runtime ini.' },
    };
  }

  const supabaseUrl = getEnv(env, 'SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnv(env, 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: 'Supabase env belum lengkap. Isi SUPABASE_URL & SUPABASE_ANON_KEY.',
      },
    };
  }

  try {
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/keep_alive`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        status: 500,
        payload: {
          ok: false,
          error: 'Gagal memanggil RPC keep_alive.',
          status: response.status,
          body,
        },
      };
    }

    const data = await response.json().catch(() => null);
    return {
      status: 200,
      payload: {
        ok: true,
        data,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

const loadLocalEnvFile = (fileName) => {
  const fullPath = resolve(process.cwd(), fileName);
  if (!existsSync(fullPath)) return {};

  const lines = readFileSync(fullPath, 'utf8').split(/\r?\n/);
  const parsed = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    parsed[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }

  return parsed;
};

const resolveRuntimeEnv = () => {
  const processEnv = globalThis?.process?.env ?? {};
  return {
    ...loadLocalEnvFile('.env'),
    ...loadLocalEnvFile('.env.local'),
    ...processEnv,
  };
};

const directRunTarget = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
const isDirectRun = import.meta.url === directRunTarget;

if (isDirectRun) {
  const result = await runSupabaseKeepAlive({ env: resolveRuntimeEnv() });
  const text = JSON.stringify(result.payload, null, 2);
  if (result.status >= 400) {
    console.error(text);
    process.exit(1);
  }
  console.log(text);
}
