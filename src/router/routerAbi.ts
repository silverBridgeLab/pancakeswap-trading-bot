/**
 * PancakeSwap / Uniswap V2-style router ABI fragments for decoding leader swaps only.
 */
export const ROUTER_SWAP_FRAGMENTS = [
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
] as const;
