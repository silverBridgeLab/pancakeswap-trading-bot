import path from 'node:path';
import type { SwapSignal } from './types.js';
import { loadConfig } from './config.js';
import { createAppLogger } from './logger.js';
import { BlockPollLeaderWatcher } from './watch/blockPollWatcher.js';
import { CopyTradingLoop } from './engine/copyLoop.js';
import { createExecutor } from './executor/factory.js';

async function main(): Promise<void> {
  const cwd = path.resolve(process.cwd());
  const cfg = loadConfig(cwd);
  const logger = createAppLogger('pancake-copy-1', Boolean(cfg.VERBOSE_LOGS));

  logger.info('Pancake copy companion #1 booting — education build on BNB Chain', {
    mode: cfg.EXECUTION_MODE,
    leadersTracked: cfg.leaders.size,
  });

  const loop = new CopyTradingLoop(cfg, logger, createExecutor(cfg.EXECUTION_MODE, logger));
  const watcher = new BlockPollLeaderWatcher(cfg, logger, (s: SwapSignal) => void loop.handle(s));
  watcher.start();

  process.on('SIGINT', () => {
    watcher.dispose();
    logger.info(`goodbye • mirrored intents staged: ${loop.followerTxCount}`);
    process.exit(0);
  });
}

await main();
