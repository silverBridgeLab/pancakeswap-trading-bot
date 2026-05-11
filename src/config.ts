import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';
import { PANCAKE_ROUTER_V2 } from './constants.js';

const envSchema = z.object({
  RPC_URL_BSC: z.string().min(12, 'provide an HTTP or WebSocket RPC endpoint'),
  LEADER_ADDRESSES: z.string(),
  POLL_INTERVAL_MS: z.coerce.number().int().min(500).default(3500),
  SIZE_NUMERATOR_BP: z.coerce.number().int().min(1).max(10000).default(1000),
  SIZE_DENOMINATOR_BP: z.coerce.number().int().min(1).max(100_000).default(10_000),
  EXECUTION_MODE: z.enum(['dry-run', 'live-stub']).default('dry-run'),
  VERBOSE_LOGS: z
    .string()
    .optional()
    .transform((v) => v === '1' || v?.toLowerCase() === 'true'),
  LOOKBACK_BLOCKS: z.coerce.number().int().min(1).max(500).default(30),
});

export type AppConfig = z.infer<typeof envSchema> & {
  cwd: string;
  routerAddress: string;
  leaders: ReadonlySet<string>;
};

function parseLeaders(raw: string): ReadonlySet<string> {
  const parts = raw
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(parts);
}

export function loadConfig(cwd: string): AppConfig {
  const envPath = path.join(cwd, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }
  const data = parsed.data;
  return {
    ...data,
    cwd,
    routerAddress: PANCAKE_ROUTER_V2,
    leaders: parseLeaders(data.LEADER_ADDRESSES),
  };
}
