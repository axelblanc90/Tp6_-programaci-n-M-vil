import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Dispositivo } from '../types/device.types.ts';
import { ArpDiscoveryService } from '../layers/discovery/ArpDiscoveryService.ts';
import { BonjourDiscoveryService } from '../layers/discovery/BonjourDiscoveryService.ts';
import { LocalDatabase } from '../layers/storage/watermelon/database.ts';

interface Props {
  onSelectDevice: (device: Dispositivo) => void;
}

export const DiscoveryScreen: React.FC<Props> = ({ onSelectDevice }) => {
  const [devices, setDevices] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'ARP' | 'mDNS'>('ARP');

  const handleScan = async () => {
    setLoading(true);
    try {
      let results: Dispositivo[] = [];
      if (method === 'ARP') {
        results = await ArpDiscoveryService.scanSubnet('192.168.1');
      } else {
        results = await BonjourDiscoveryService.scanServices();
      }

      setDevices(results);
      for (const d of results) {
        await LocalDatabase.saveDevice(d);
      }
    } catch (err: any) {
      alert(err.message || 'Error al escanear la red');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Dispositivo }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectDevice(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.ipText}>{item.ip}</Text>
        <View style={styles.methodBadge}>
          <Text style={styles.methodText}>{item.discoveryMethod}</Text>
        </View>
      </View>

      <Text style={styles.hostnameText}>{item.hostname || 'Sin hostname'}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.macText}>MAC: {item.mac}</Text>
        <Text style={styles.vendorText}>{item.vendor || 'Desconocido'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Descubrimiento de Red (LAN)</Text>
        <Text style={styles.subtitle}>Escaneo de subred ARP / mDNS sin abstracciones HTTP</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tab, method === 'ARP' && styles.activeTab]}
            onPress={() => setMethod('ARP')}
          >
            <Text style={[styles.tabText, method === 'ARP' && styles.activeTabText]}>Barrido ARP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, method === 'mDNS' && styles.activeTab]}
            onPress={() => setMethod('mDNS')}
          >
            <Text style={[styles.tabText, method === 'mDNS' && styles.activeTabText]}>mDNS / Bonjour</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.disabledButton]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.scanButtonText}>Escanear Red Local</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Presione "Escanear Red Local" para listar equipos activos.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  controls: {
    padding: 16,
    gap: 12,
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  scanButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ipText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  methodBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  methodText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  hostnameText: {
    color: '#e2e8f0',
    fontSize: 13,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 6,
  },
  macText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  vendorText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
});
