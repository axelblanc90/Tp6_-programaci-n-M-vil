import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform, StatusBar } from 'react-native';
import { SyncStatusBar } from './components/SyncStatusBar.tsx';
import { DiscoveryScreen } from './screens/DiscoveryScreen.tsx';
import { SnmpSshScreen } from './screens/SnmpSshScreen.tsx';
import { InstallationScreen } from './screens/InstallationScreen.tsx';
import { HistoryScreen } from './screens/HistoryScreen.tsx';
import { Dispositivo } from './types/device.types.ts';

type ActiveTab = 'discovery' | 'diagnostics' | 'installation' | 'history';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discovery');
  const [selectedDevice, setSelectedDevice] = useState<Dispositivo | null>(null);

  const handleSelectDevice = (device: Dispositivo) => {
    setSelectedDevice(device);
    setActiveTab('diagnostics');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <SyncStatusBar />

      <View style={styles.content}>
        {activeTab === 'discovery' && (
          <DiscoveryScreen onSelectDevice={handleSelectDevice} />
        )}
        {activeTab === 'diagnostics' && (
          <SnmpSshScreen selectedDevice={selectedDevice} />
        )}
        {activeTab === 'installation' && (
          <InstallationScreen />
        )}
        {activeTab === 'history' && (
          <HistoryScreen />
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'discovery' && styles.activeTabButton]}
          onPress={() => setActiveTab('discovery')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'discovery' && styles.activeTabButtonText]}>
            Descubrir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'diagnostics' && styles.activeTabButton]}
          onPress={() => setActiveTab('diagnostics')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'diagnostics' && styles.activeTabButtonText]}>
            SNMP / SSH
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'installation' && styles.activeTabButton]}
          onPress={() => setActiveTab('installation')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'installation' && styles.activeTabButtonText]}>
            Instalación
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.activeTabButtonText]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#0b1120',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: '#1e293b',
  },
  tabButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});

export default App;
