/**
 * Canonical shape for a decoded router swap spotted from a watched leader wallet.
 */
export interface SwapSignal {
  /** Leader EOA transaction hash observed on-chain */
  correlatesTo: string;
  /** Original leader address (checksummed lowercase for maps) */
  leader: string;
  /** Human-readable routing label */
  kind: 'exact-tokens' | 'exact-eth-in' | 'exact-eth-out' | 'unknown';
  tokenIn: string;
  tokenOut: string;
  amountInWei: bigint;
  amountOutMinWei: bigint;
  path: readonly string[];
  observedAtMs: number;
}

export interface FollowerIntent extends SwapSignal {
  /** Desired follower sizing after proportional scaling */
  scaledAmountInWei: bigint;
  scaledAmountOutMinWei: bigint;
}
