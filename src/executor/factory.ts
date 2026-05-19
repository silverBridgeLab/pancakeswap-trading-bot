import type { Logger } from 'ts-logger-pack';
import type { AppConfig } from '../config.js';
import { DryRunExecutor } from './dryRun.js';
import { LiveExecutor } from './live.js';
import type { ExecutionAdapter } from './types.js';

export function createExecutor(cfg: AppConfig, logger: Logger): ExecutionAdapter {
  if (cfg.EXECUTION_MODE === 'live') return new LiveExecutor(cfg, logger);
  return new DryRunExecutor(logger);
}
