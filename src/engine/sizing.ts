import type { FollowerIntent, SwapSignal } from '../types.js';

export function scaleSignalToIntent(
  signal: SwapSignal,
  numeratorBp: number,
  denominatorBp: number,
): FollowerIntent {
  if (denominatorBp <= 0) throw new Error('SIZE_DENOMINATOR_BP must be positive');
  const num = BigInt(numeratorBp);
  const den = BigInt(denominatorBp);
  const scaledAmountInWei = (signal.amountInWei * num) / den;
  const scaledAmountOutMinWei = (signal.amountOutMinWei * num) / den;
  return {
    ...signal,
    scaledAmountInWei,
    scaledAmountOutMinWei,
  };
}
