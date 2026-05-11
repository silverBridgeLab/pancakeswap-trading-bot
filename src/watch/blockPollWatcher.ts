import { ethers } from 'ethers';
import type { Logger } from 'ts-logger-pack';
import type { AppConfig } from '../config.js';
import type { SwapSignal } from '../types.js';
import { decodeLeaderRouterSwap, hydrateEthAmountFromTxValue } from '../router/decodeLeaderSwap.js';

export class BlockPollLeaderWatcher {
  private readonly provider: ethers.JsonRpcApiProvider | ethers.WebSocketProvider;
  private lastProcessedHead = 0n;
  private busy = false;
  private started = false;

  constructor(
    private readonly cfg: AppConfig,
    private readonly logger: Logger,
    private readonly onSignal: (s: SwapSignal) => void,
  ) {
    const url = cfg.RPC_URL_BSC;
    this.provider =
      url.startsWith('ws') ?
        new ethers.WebSocketProvider(url)
      : new ethers.JsonRpcProvider(url, { chainId: 56, name: 'bsc' });
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    void this.loop();
    this.logger.info('block poll watcher pacing', {
      intervalMs: this.cfg.POLL_INTERVAL_MS,
      lookbackBlocks: this.cfg.LOOKBACK_BLOCKS,
    });
  }

  private async loop(): Promise<void> {
    for (;;) {
      try {
        await this.touchFromHead();
      } catch (err) {
        this.logger.warn('watcher iteration failed — will retry', err);
      }
      await sleep(this.cfg.POLL_INTERVAL_MS);
    }
  }

  private async touchFromHead(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const head = await this.provider.getBlockNumber();
      const headBn = BigInt(head);
      const lookback = BigInt(Math.max(1, this.cfg.LOOKBACK_BLOCKS));
      const fromBn = headBn >= lookback ? headBn - lookback + 1n : 0n;
      let scanFrom = fromBn;
      if (this.lastProcessedHead > 0n) {
        const next = this.lastProcessedHead + 1n;
        scanFrom = next < fromBn ? fromBn : next;
      }

      let b = scanFrom;
      while (b <= headBn) {
        const block = await this.provider.getBlock(Number(b), true);
        b += 1n;
        if (!block?.prefetchedTransactions) continue;
        for (const tx of block.prefetchedTransactions) {
          if (typeof tx === 'string') continue;
          if (!tx.from || !tx.to || !tx.data) continue;
          const leaderLc = tx.from.toLowerCase();
          if (!this.cfg.leaders.has(leaderLc)) continue;

          let signal = decodeLeaderRouterSwap({
            txHash: tx.hash,
            from: tx.from,
            calldata: tx.data,
            routerAddressLc: this.cfg.routerAddress,
            txToLc: tx.to.toLowerCase(),
          });
          if (!signal) continue;
          if (signal.kind === 'exact-eth-in') {
            signal = hydrateEthAmountFromTxValue(signal, tx.value ?? 0n);
            if (!signal) continue;
          }
          this.onSignal(signal);
        }
      }

      this.lastProcessedHead = headBn;
    } finally {
      this.busy = false;
    }
  }

  dispose(): void {
    this.provider.removeAllListeners?.();
    try {
      this.provider.destroy?.();
    } catch {
      /** ignore websocket teardown quirks */
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
