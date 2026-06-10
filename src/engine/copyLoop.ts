import type { Logger } from '../logger.js';
import { cacheHas, cacheSet } from '../cache/store.js';
import type { AppConfig } from '../config.js';
import type { SwapSignal } from '../types.js';
import { scaleSignalToIntent } from './sizing.js';
import type { ExecutionAdapter } from '../executor/types.js';

export class CopyTradingLoop {
  private readonly seen = new Set<string>();
  public followerTxCount = 0;

  constructor(
    private readonly cfg: AppConfig,
    private readonly logger: Logger,
    private readonly executor: ExecutionAdapter,
  ) {}

  async handle(signal: SwapSignal): Promise<void> {
    if (this.seen.has(signal.correlatesTo) || (await cacheHas(`seen:${signal.correlatesTo}`))) {
      return;
    }
    this.seen.add(signal.correlatesTo);
    await cacheSet(`seen:${signal.correlatesTo}`, '1');

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
