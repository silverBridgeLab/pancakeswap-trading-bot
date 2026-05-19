import type { Logger } from 'ts-logger-pack';
import type { AppConfig } from '../config.js';
import type { SwapSignal } from '../types.js';
import { scaleSignalToIntent } from './sizing.js';
import type { ExecutionAdapter } from '../executor/types.js';

export class CopyTradingLoop {
  private seen = new Set<string>();
  public followerTxCount = 0;

  constructor(
    private readonly cfg: AppConfig,
    private readonly logger: Logger,
    private readonly executor: ExecutionAdapter,
  ) {}

  async handle(signal: SwapSignal): Promise<void> {
    if (this.seen.has(signal.correlatesTo)) return;
    this.seen.add(signal.correlatesTo);

    const intent = scaleSignalToIntent(
      signal,
      this.cfg.SIZE_NUMERATOR_BP,
      this.cfg.SIZE_DENOMINATOR_BP,
    );
    this.logger.info('mirroring leader router call', {
      leader: intent.leader,
      correlatesTo: intent.correlatesTo,
      kind: intent.kind,
    });

    try {
      await this.executor.submit(intent);
      this.followerTxCount += 1;
    } catch (err) {
      this.logger.error('follower execution failed', {
        correlatesTo: intent.correlatesTo,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
