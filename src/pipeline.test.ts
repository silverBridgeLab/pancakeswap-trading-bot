import { ethers } from 'ethers';
import { afterEach, describe, expect, it } from 'vitest';
import { cacheGet, cacheSet } from './cache/store.js';
import { CopyTradingLoop } from './engine/copyLoop.js';
import { DryRunExecutor } from './executor/dryRun.js';
import { createAppLogger } from './logger.js';
import { PANCAKE_ROUTER_V2 } from './constants.js';
import { decodeLeaderRouterSwap } from './router/decodeLeaderSwap.js';
import type { AppConfig } from './config.js';

const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';

function testConfig(leaders: string[]): AppConfig {
  return {
    cwd: process.cwd(),
    RPC_URL_BSC: 'https://bsc.drpc.org',
    LEADER_ADDRESSES: leaders.join(','),
    POLL_INTERVAL_MS: 4000,
    LOOKBACK_BLOCKS: 10,
    SIZE_NUMERATOR_BP: 1500,
    SIZE_DENOMINATOR_BP: 10_000,
    EXECUTION_MODE: 'dry-run',
    TX_DEADLINE_SECONDS: 300,
    VERBOSE_LOGS: false,
    routerAddress: PANCAKE_ROUTER_V2,
    leaders: new Set(leaders.map((a) => a.toLowerCase())),
  };
}

describe('copy-trading pipeline', () => {
  afterEach(() => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
  });

  it('decodes Pancake router calldata into a swap signal', () => {
    const leader = '0x1111111111111111111111111111111111111111';
    const iface = new ethers.Interface([
      'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
    ]);
    const calldata = iface.encodeFunctionData('swapExactTokensForTokens', [
      1_000_000_000_000_000_000n,
      900_000_000_000_000_000n,
      [WBNB, BUSD],
      leader,
      BigInt(Math.floor(Date.now() / 1000) + 300),
    ]);

    const signal = decodeLeaderRouterSwap({
      txHash: '0xdeadbeef',
      from: leader,
      calldata,
      routerAddressLc: PANCAKE_ROUTER_V2,
      txToLc: PANCAKE_ROUTER_V2,
    });

    expect(signal).not.toBeNull();
    expect(signal?.kind).toBe('exact-tokens');
    expect(signal?.amountInWei).toBe(1_000_000_000_000_000_000n);
    expect(signal?.path[0]).toBe(WBNB.toLowerCase());
  });

  it('mirrors a decoded signal through dry-run execution', async () => {
    const leader = '0x2222222222222222222222222222222222222222';
    const logger = createAppLogger('test', false);
    const cfg = testConfig([leader]);
    const loop = new CopyTradingLoop(cfg, logger, new DryRunExecutor(logger));

    await loop.handle({
      correlatesTo: '0xabc123',
      leader,
      kind: 'exact-tokens',
      tokenIn: WBNB.toLowerCase(),
      tokenOut: BUSD.toLowerCase(),
      amountInWei: 10_000_000_000_000_000_000n,
      amountOutMinWei: 9_000_000_000_000_000_000n,
      path: [WBNB.toLowerCase(), BUSD.toLowerCase()],
      observedAtMs: Date.now(),
    });

    expect(loop.followerTxCount).toBe(1);

    await loop.handle({
      correlatesTo: '0xabc123',
      leader,
      kind: 'exact-tokens',
      tokenIn: WBNB.toLowerCase(),
      tokenOut: BUSD.toLowerCase(),
      amountInWei: 10_000_000_000_000_000_000n,
      amountOutMinWei: 9_000_000_000_000_000_000n,
      path: [WBNB.toLowerCase(), BUSD.toLowerCase()],
      observedAtMs: Date.now(),
    });

    expect(loop.followerTxCount).toBe(1);
  });

  it('persists cache entries in memory when Redis is disabled', async () => {
    await cacheSet('pipeline-test-key', 'ok', 60);
    expect(await cacheGet('pipeline-test-key')).toBe('ok');
  });
});
