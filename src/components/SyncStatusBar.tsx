import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { OutboxQueue } from '../layers/sync/OutboxQueue.ts';
import { SyncStatus } from '../types/sync.types.ts';

export const SyncStatusBar: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
  });

  useEffect(() => {
    const unsubscribe = OutboxQueue.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleOnline = () => {
    OutboxQueue.toggleSimulatedNetwork(!status.isOnline);
  };

  const handleForceSync = () => {
    OutboxQueue.processQueue();
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.dot, { backgroundColor: status.isOnline ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {status.isOnline ? 'ONLINE' : 'OFFLINE (MODO CAMPO)'}
          </Text>
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={[styles.chipButton, { backgroundColor: status.isOnline ? '#334155' : '#0284c7' }]}
            onPress={handleToggleOnline}
          >
            <Text style={styles.chipButtonText}>
              {status.isOnline ? 'Simular Offline' : 'Restaurar Red'}
            </Text>
          </TouchableOpacity>

          {status.pendingCount > 0 && status.isOnline && (
            <TouchableOpacity
              style={[styles.chipButton, styles.syncButton]}
              onPress={handleForceSync}
              disabled={status.isSyncing}
            >
              <Text style={styles.chipButtonText}>
                {status.isSyncing ? 'Sincronizando...' : `Sincronizar (${status.pendingCount})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.outboxInfo}>
          Cola Outbox: <Text style={styles.boldText}>{status.pendingCount} pendientes</Text>
        </Text>
        {status.lastSyncAt && (
          <Text style={styles.lastSyncText}>
            Última sync: {new Date(status.lastSyncAt).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  syncButton: {
    backgroundColor: '#10b981',
  },
  chipButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  outboxInfo: {
    color: '#94a3b8',
    fontSize: 11,
  },
  boldText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  lastSyncText: {
    color: '#64748b',
    fontSize: 11,
  },
});
