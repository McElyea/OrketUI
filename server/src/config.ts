import fs from 'node:fs';
import path from 'node:path';

type EnvMap = Record<string, string>;

function parseEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) return {};

  const env: EnvMap = {};
  const text = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function readLocalEnv(): EnvMap {
  const workspaceRoot = path.resolve(__dirname, '..', '..');
  const siblingOrketRoot = path.resolve(workspaceRoot, '..', 'Orket');

  const files = [
    path.join(workspaceRoot, '.env'),
    path.join(workspaceRoot, 'server', '.env'),
    path.join(siblingOrketRoot, '.env'),
  ];

  return files.reduce<EnvMap>((acc, file) => ({ ...acc, ...parseEnvFile(file) }), {});
}

const localEnv = readLocalEnv();

function env(name: string, fallback?: string): string {
  return process.env[name] ?? localEnv[name] ?? fallback ?? '';
}

function envAny(names: string[], fallback?: string): string {
  for (const name of names) {
    const value = process.env[name] ?? localEnv[name];
    if (value) return value;
  }
  return fallback ?? '';
}

function envAnyWithSource(names: string[], fallback?: string): { value: string; source: string } {
  for (const name of names) {
    if (process.env[name]) {
      return { value: process.env[name] as string, source: `process:${name}` };
    }

    if (localEnv[name]) {
      return { value: localEnv[name], source: `file:${name}` };
    }
  }

  return { value: fallback ?? '', source: 'fallback' };
}

const demoPasswordConfig = envAnyWithSource(['DEMO_PASSWORD', 'DASHBOARD_PASSWORD'], 'orket-demo');

export const config = {
  PORT: parseInt(env('PORT', '3001'), 10),
  ORKET_API_URL: env('ORKET_API_URL', 'http://localhost:8082'),
  ORKET_API_KEY: envAny(['ORKET_API_KEY', 'DASHBOARD_SECRET_KEY'], ''),
  SESSION_SECRET: envAny(['SESSION_SECRET', 'DASHBOARD_SECRET_KEY'], 'change-me-in-production'),
  NODE_ENV: env('NODE_ENV', 'development'),
  CLIENT_DIST_PATH: '../client/dist',
  DEMO_PASSWORD: demoPasswordConfig.value,
  DEMO_PASSWORD_SOURCE: demoPasswordConfig.source,
  DEMO_PASSWORD_LENGTH: demoPasswordConfig.value.length,
};
