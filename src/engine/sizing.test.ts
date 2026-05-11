import { describe, expect, it } from 'vitest';
import { scaleSignalToIntent } from './sizing.js';
import type { SwapSignal } from '../types.js';

const base: SwapSignal = {
  correlatesTo: '0xabc',
  leader: '0xdead',
  kind: 'exact-tokens',
  tokenIn: '0x1',
  tokenOut: '0x2',
  amountInWei: 10_000n,
  amountOutMinWei: 9_000n,
  path: ['0x1', '0x2'],
  observedAtMs: 0,
};

describe('scaleSignalToIntent', () => {
  it('scales amounts by basis-point ratio', () => {
    const intent = scaleSignalToIntent(base, 1000, 10_000);
    expect(intent.scaledAmountInWei).toBe(1_000n);
    expect(intent.scaledAmountOutMinWei).toBe(900n);
  });
});
