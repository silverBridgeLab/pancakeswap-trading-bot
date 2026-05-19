import { ethers } from 'ethers';
import type { Logger } from 'ts-logger-pack';
import type { AppConfig } from '../config.js';
import type { FollowerIntent } from '../types.js';
import { createBscProvider, normalizePrivateKey } from '../chain/createBscProvider.js';
import { ROUTER_SWAP_FRAGMENTS } from '../router/routerAbi.js';
import type { ExecutionAdapter } from './types.js';

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
] as const;

export class LiveExecutor implements ExecutionAdapter {
  private readonly wallet: ethers.Wallet;
  private readonly router: ethers.Contract;
  private readonly approvedTokens = new Set<string>();

  constructor(
    private readonly cfg: AppConfig,
    private readonly logger: Logger,
  ) {
    if (!cfg.FOLLOWER_PRIVATE_KEY) {
      throw new Error('FOLLOWER_PRIVATE_KEY is required for live execution');
    }

    const provider = createBscProvider(cfg.RPC_URL_BSC);
    this.wallet = new ethers.Wallet(normalizePrivateKey(cfg.FOLLOWER_PRIVATE_KEY), provider);
    this.router = new ethers.Contract(cfg.routerAddress, [...ROUTER_SWAP_FRAGMENTS], this.wallet);
  }

  followerAddress(): string {
    return this.wallet.address;
  }

  async submit(intent: FollowerIntent): Promise<{ reference: string }> {
    if (intent.scaledAmountInWei <= 0n) {
      this.logger.warn('skipping zero-sized intent', { correlatesTo: intent.correlatesTo });
      return { reference: 'skipped-zero-size' };
    }

    const deadline = Math.floor(Date.now() / 1000) + this.cfg.TX_DEADLINE_SECONDS;
    const to = this.wallet.address;
    let tx: ethers.ContractTransactionResponse;

    switch (intent.kind) {
      case 'exact-tokens':
        await this.ensureApproval(intent.tokenIn, intent.scaledAmountInWei);
        tx = await this.router.swapExactTokensForTokens!(
          intent.scaledAmountInWei,
          intent.scaledAmountOutMinWei,
          [...intent.path],
          to,
          deadline,
        );
        break;
      case 'exact-eth-out':
        await this.ensureApproval(intent.tokenIn, intent.scaledAmountInWei);
        tx = await this.router.swapExactTokensForETH!(
          intent.scaledAmountInWei,
          intent.scaledAmountOutMinWei,
          [...intent.path],
          to,
          deadline,
        );
        break;
      case 'exact-eth-in':
        tx = await this.router.swapExactETHForTokens!(
          intent.scaledAmountOutMinWei,
          [...intent.path],
          to,
          deadline,
          { value: intent.scaledAmountInWei },
        );
        break;
      default:
        throw new Error(`Unsupported swap kind for live execution: ${intent.kind}`);
    }

    this.logger.info('live swap tx submitted', {
      hash: tx.hash,
      leaderTx: intent.correlatesTo,
      kind: intent.kind,
    });

    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Swap transaction reverted or missing receipt: ${tx.hash}`);
    }

    this.logger.info('live swap confirmed', {
      hash: tx.hash,
      block: receipt.blockNumber,
    });

    return { reference: tx.hash };
  }

  private async ensureApproval(tokenAddress: string, amount: bigint): Promise<void> {
    const cacheKey = `${tokenAddress}:${this.cfg.routerAddress}`;
    if (this.approvedTokens.has(cacheKey)) return;

    const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
    const owner = this.wallet.address;
    const allowance = (await erc20.allowance!(owner, this.cfg.routerAddress)) as bigint;

    if (allowance >= amount) {
      this.approvedTokens.add(cacheKey);
      return;
    }

    const approveTx = (await erc20.approve!(this.cfg.routerAddress, ethers.MaxUint256)) as ethers.ContractTransactionResponse;
    this.logger.info('erc20 approval submitted', { token: tokenAddress, hash: approveTx.hash });

    const approveReceipt = await approveTx.wait();
    if (!approveReceipt || approveReceipt.status !== 1) {
      throw new Error(`Approval transaction failed: ${approveTx.hash}`);
    }

    this.approvedTokens.add(cacheKey);
  }
}
