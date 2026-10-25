import { OutboxActionType, OutboxItem, SyncBatchResult, SyncStatus } from '../../types/sync.types.ts';

export class OutboxQueue {
  private static STORAGE_KEY = 'tp6_outbox_queue_items';
  private static isSyncing = false;
  private static simulatedOnline = true;
  private static listeners: Array<(status: SyncStatus) => void> = [];

  static async enqueue(type: OutboxActionType, payload: any): Promise<OutboxItem> {
    const items = await this.getItems();
    const item: OutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    items.push(item);
    this.saveItems(items);
    this.notifyStatus();

    // Si hay conectividad, intentar vaciar la cola inmediatamente
    if (this.simulatedOnline) {
      this.processQueue();
    }

    return item;
  }

  static async getItems(): Promise<OutboxItem[]> {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  }

  static async processQueue(): Promise<SyncBatchResult | null> {
    if (this.isSyncing) return null;

    const items = await this.getItems();
    if (items.length === 0) return null;

    if (!this.simulatedOnline) {
      console.log('[OUTBOX] Dispositivo offline: cola retenida localmente.');
      return null;
    }

    this.isSyncing = true;
    this.notifyStatus();

    try {
      const batchId = `BATCH-${Date.now()}`;
      const response = await fetch('http://localhost:3001/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          items,
        }),
      });

      if (response.ok) {
        const result: SyncBatchResult = await response.json();
        this.saveItems([]); // Cola vaciada con éxito
        this.notifyStatus(result.syncedAt);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      // Reintento exponencial y registro de intentos
      const updated = items.map((item) => ({
        ...item,
        attempts: item.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError: err?.message || 'Error de red',
      }));
      this.saveItems(updated);
      this.notifyStatus(null, err?.message || 'Fallo de sincronización');
      return null;
    } finally {
      this.isSyncing = false;
      this.notifyStatus();
    }
  }

  static toggleSimulatedNetwork(isOnline: boolean): void {
    this.simulatedOnline = isOnline;
    this.notifyStatus();
    if (isOnline) {
      this.processQueue();
    }
  }

  static isNetworkAvailable(): boolean {
    return this.simulatedOnline;
  }

  static subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    this.notifyStatus();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static notifyStatus(lastSyncAt: string | null = null, lastError: string | null = null): void {
    const items = this.getItemsSync();
    const status: SyncStatus = {
      isOnline: this.simulatedOnline,
      isSyncing: this.isSyncing,
      pendingCount: items.length,
      lastSyncAt,
      lastError,
    };
    this.listeners.forEach((fn) => fn(status));
  }

  private static saveItems(items: OutboxItem[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    }
  }

  private static getItemsSync(): OutboxItem[] {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  }
}
