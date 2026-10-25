export type OutboxActionType = 'DEVICE' | 'DIAGNOSTIC' | 'INSTALLATION';

export interface OutboxItem {
  id: string;
  type: OutboxActionType;
  payload: any;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
}

export interface SyncBatchResult {
  batchId: string;
  success: boolean;
  receivedCount: number;
  syncedAt: string;
  message?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
}
