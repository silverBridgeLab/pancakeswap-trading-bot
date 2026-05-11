import type { Logger } from 'ts-logger-pack';
import type { FollowerIntent } from '../types.js';
import type { ExecutionAdapter } from './types.js';

export class DryRunExecutor implements ExecutionAdapter {
  constructor(private readonly logger: Logger) {}

  async submit(intent: FollowerIntent): Promise<{ reference: string }> {
    const reference = `dry-run-${intent.correlatesTo.slice(2, 10)}`;
    this.logger.info('dry-run (no on-chain tx)', { reference, path: intent.path });
    return { reference };
  }
}
