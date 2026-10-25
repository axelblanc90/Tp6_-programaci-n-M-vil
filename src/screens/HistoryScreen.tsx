import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { RegistroInstalacion } from '../types/installation.types.ts';
import { DiagnosticoLocal, LocalDatabase } from '../layers/storage/watermelon/database.ts';
import { PdfReportGenerator } from '../layers/reporting/PdfReportGenerator.ts';

export const HistoryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'installations' | 'diagnostics'>('installations');
  const [installations, setInstallations] = useState<RegistroInstalacion[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticoLocal[]>([]);

  const loadData = async () => {
    const instList = await LocalDatabase.getInstallations();
    const diagList = await LocalDatabase.getDiagnostics();
    setInstallations(instList);
    setDiagnostics(diagList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportInstallationPdf = async (inst: RegistroInstalacion) => {
    await PdfReportGenerator.generateReport(inst);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial Offline de Campo (RF-08)</Text>
        <Text style={styles.subtitle}>Auditorías, diagnósticos e instalaciones almacenadas en WatermelonDB</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'installations' && styles.activeTab]}
          onPress={() => setActiveTab('installations')}
        >
          <Text style={[styles.tabText, activeTab === 'installations' && styles.activeTabText]}>
            Instalaciones ({installations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diagnostics' && styles.activeTab]}
          onPress={() => setActiveTab('diagnostics')}
        >
          <Text style={[styles.tabText, activeTab === 'diagnostics' && styles.activeTabText]}>
            Diagnósticos ({diagnostics.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'installations' ? (
        <FlatList
          data={installations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.siteTitle}>{item.siteName}</Text>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.deviceInfo}>Equipo: {item.deviceCode} ({item.deviceIp})</Text>
              <Text style={styles.techText}>Técnico: {item.technicianName}</Text>
              <Text style={styles.notesText}>{item.notes}</Text>

              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() => handleExportInstallationPdf(item)}
              >
                <Text style={styles.pdfButtonText}>Ver Reporte PDF</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay registros de instalación guardados en base local.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={diagnostics}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.siteTitle}>{item.deviceIp}</Text>
                <Text style={styles.dateText}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              </View>
              {item.snmpTelemetry && (
                <View style={styles.diagBox}>
                  <Text style={styles.diagBadge}>SNMP</Text>
                  <Text style={styles.diagText}>sysName: {item.snmpTelemetry.sysName}</Text>
                  <Text style={styles.diagText}>Uptime: {item.snmpTelemetry.sysUpTime}</Text>
                </View>
              )}
              {item.sshResult && (
                <View style={styles.diagBox}>
                  <Text style={styles.diagBadge}>SSH</Text>
                  <Text style={styles.diagText}>$ {item.sshResult.command}</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay diagnósticos registrados en la base local.</Text>
            </View>
          }
        />
      )}
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
  },
  deviceInfo: {
    color: '#f1f5f9',
    fontSize: 12,
    marginTop: 4,
  },
  techText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  notesText: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  pdfButton: {
    marginTop: 10,
    backgroundColor: '#0369a1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  diagBox: {
    marginTop: 6,
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 4,
  },
  diagBadge: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  diagText: {
    color: '#e2e8f0',
    fontSize: 11,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
  },
});
