import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';
import { PANCAKE_ROUTER_V2 } from './constants.js';

const executionModes = ['dry-run', 'live'] as const;

const envSchema = z
  .object({
    RPC_URL_BSC: z.string().min(12, 'provide an HTTP or WebSocket RPC endpoint'),
    LEADER_ADDRESSES: z.string(),
    POLL_INTERVAL_MS: z.coerce.number().int().min(500).default(3500),
    SIZE_NUMERATOR_BP: z.coerce.number().int().min(1).max(10000).default(1000),
    SIZE_DENOMINATOR_BP: z.coerce.number().int().min(1).max(100_000).default(10_000),
    EXECUTION_MODE: z.enum(executionModes).default('dry-run'),
    FOLLOWER_PRIVATE_KEY: z.string().optional(),
    TX_DEADLINE_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
    VERBOSE_LOGS: z
      .string()
      .optional()
      .transform((v) => v === '1' || v?.toLowerCase() === 'true'),
    LOOKBACK_BLOCKS: z.coerce.number().int().min(1).max(500).default(30),
  })
  .superRefine((data, ctx) => {
    if (data.EXECUTION_MODE !== 'live') return;

    const pk = data.FOLLOWER_PRIVATE_KEY?.trim() ?? '';
    const hex = pk.startsWith('0x') ? pk.slice(2) : pk;
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FOLLOWER_PRIVATE_KEY'],
        message: 'FOLLOWER_PRIVATE_KEY must be a 32-byte hex key when EXECUTION_MODE=live',
      });
    }
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
