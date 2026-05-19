import { ethers } from 'ethers';

export function createBscProvider(rpcUrl: string): ethers.JsonRpcApiProvider | ethers.WebSocketProvider {
  return rpcUrl.startsWith('ws') ?
      new ethers.WebSocketProvider(rpcUrl)
    : new ethers.JsonRpcProvider(rpcUrl, { chainId: 56, name: 'bsc' });
}

export function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
}
