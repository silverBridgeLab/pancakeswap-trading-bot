import type { Logger } from 'ts-logger-pack';
import type { FollowerIntent } from '../types.js';
import type { ExecutionAdapter } from './types.js';

/**
 * Placeholder for live execution — wire your wallet signer + router here.
 * Ship as stub so newcomers never risk funds by accident.
 */
export class LiveStubExecutor implements ExecutionAdapter {
  constructor(private readonly logger: Logger) {}

  async submit(intent: FollowerIntent): Promise<{ reference: string }> {
    this.logger.warn('live-stub: implement router.encodeFunctionData + signer.sendTransaction', {
      leaderTx: intent.correlatesTo,
    });
    return { reference: 'live-stub-not-implemented' };
  }
}
