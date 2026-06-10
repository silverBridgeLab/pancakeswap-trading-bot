import path from 'node:path';
import { Wallet } from 'ethers';
import type { SwapSignal } from './types.js';
import { loadConfig } from './config.js';
import { createAppLogger } from './logger.js';
import { normalizePrivateKey } from './chain/createBscProvider.js';
import { BlockPollLeaderWatcher } from './watch/blockPollWatcher.js';
import { CopyTradingLoop } from './engine/copyLoop.js';
import { createExecutor } from './executor/factory.js';
import { closeRedisClient, isRedisEnabled, pingRedis } from './redis.js';

async function main(): Promise<void> {
  const cwd = path.resolve(process.cwd());
  const cfg = loadConfig(cwd);
  const logger = createAppLogger('pancake-copy-1', Boolean(cfg.VERBOSE_LOGS));

  const followerWallet =
    cfg.EXECUTION_MODE === 'live' && cfg.FOLLOWER_PRIVATE_KEY ?
      new Wallet(normalizePrivateKey(cfg.FOLLOWER_PRIVATE_KEY)).address
    : undefined;

  if (isRedisEnabled()) {
    const ok = await pingRedis();
    logger[ok ? 'info' : 'warn'](
      ok ? 'Redis cache connected' : 'Redis unreachable — using in-memory cache',
    );
  } else {
    logger.info('Redis cache disabled — using in-memory cache');
  }

  logger.info('Pancake copy companion #1 booting — education build on BNB Chain', {
    mode: cfg.EXECUTION_MODE,
    leadersTracked: cfg.leaders.size,
    followerWallet,
  });

  const loop = new CopyTradingLoop(cfg, logger, createExecutor(cfg, logger));
  const watcher = new BlockPollLeaderWatcher(cfg, logger, (s: SwapSignal) => void loop.handle(s));
  await watcher.start();

  const shutdown = async (code = 0): Promise<void> => {
    watcher.dispose();
    await closeRedisClient();
    logger.info(`goodbye • mirrored intents staged: ${loop.followerTxCount}`);
    process.exit(code);
  };

  process.on('SIGINT', () => {
    void shutdown(0);
  });
  process.on('SIGTERM', () => {
    void shutdown(0);
  });
}

await main();
