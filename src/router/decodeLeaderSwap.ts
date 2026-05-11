import { ethers } from 'ethers';
import { ROUTER_SWAP_FRAGMENTS } from './routerAbi.js';
import type { SwapSignal } from '../types.js';

const iface = new ethers.Interface([...ROUTER_SWAP_FRAGMENTS]);

export function decodeLeaderRouterSwap(opts: {
  txHash: string;
  from: string;
  calldata: string;
  routerAddressLc: string;
  txToLc: string;
}): SwapSignal | null {
  const { txHash, from, calldata, routerAddressLc, txToLc } = opts;
  if (txToLc !== routerAddressLc) return null;
  let parsed;
  try {
    parsed = iface.parseTransaction({ data: calldata });
  } catch {
    return null;
  }
  if (!parsed) return null;
  const now = Date.now();
  const leader = from.toLowerCase();

  switch (parsed.name) {
    case 'swapExactTokensForTokens': {
      const amountInWei = ethers.toBigInt(parsed.args[0] as bigint);
      const amountOutMinWei = ethers.toBigInt(parsed.args[1] as bigint);
      const path = [...(parsed.args[2] as string[])].map((a) => a.toLowerCase());
      return {
        correlatesTo: txHash,
        leader,
        kind: 'exact-tokens',
        tokenIn: path[0],
        tokenOut: path[path.length - 1],
        amountInWei,
        amountOutMinWei,
        path,
        observedAtMs: now,
      };
    }
    case 'swapExactETHForTokens': {
      const amountOutMinWei = ethers.toBigInt(parsed.args[0] as bigint);
      const path = [...(parsed.args[1] as string[])].map((a) => a.toLowerCase());
      /** value is inspected at watcher layer */
      const amountInWei = 0n;
      return {
        correlatesTo: txHash,
        leader,
        kind: 'exact-eth-in',
        tokenIn: path[0],
        tokenOut: path[path.length - 1],
        amountInWei,
        amountOutMinWei,
        path,
        observedAtMs: now,
      };
    }
    case 'swapExactTokensForETH': {
      const amountInWei = ethers.toBigInt(parsed.args[0] as bigint);
      const amountOutMinWei = ethers.toBigInt(parsed.args[1] as bigint);
      const path = [...(parsed.args[2] as string[])].map((a) => a.toLowerCase());
      return {
        correlatesTo: txHash,
        leader,
        kind: 'exact-eth-out',
        tokenIn: path[0],
        tokenOut: path[path.length - 1],
        amountInWei,
        amountOutMinWei,
        path,
        observedAtMs: now,
      };
    }
    default:
      return null;
  }
}

export function hydrateEthAmountFromTxValue(signal: SwapSignal | null, txValueWei: bigint): SwapSignal | null {
  if (!signal || signal.kind !== 'exact-eth-in') return signal;
  if (txValueWei <= 0n) return null;
  return { ...signal, amountInWei: txValueWei };
}
