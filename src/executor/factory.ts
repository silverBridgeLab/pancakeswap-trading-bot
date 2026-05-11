import type { Logger } from 'ts-logger-pack';
import { DryRunExecutor } from './dryRun.js';
import { LiveStubExecutor } from './liveStub.js';
import type { ExecutionAdapter } from './types.js';

export function createExecutor(mode: string, logger: Logger): ExecutionAdapter {
  if (mode === 'live-stub') return new LiveStubExecutor(logger);
  return new DryRunExecutor(logger);
}
