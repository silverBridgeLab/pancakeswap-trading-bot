import type { FollowerIntent } from '../types.js';

export interface ExecutionAdapter {
  submit(intent: FollowerIntent): Promise<{ reference: string }>;
}
