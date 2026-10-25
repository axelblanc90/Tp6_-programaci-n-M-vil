import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Dispositivo } from '../types/device.types.ts';
import { SnmpTelemetry } from '../types/snmp.types.ts';
import { SshExecutionResult } from '../types/ssh.types.ts';
import { SnmpClient } from '../layers/protocol/snmp/SnmpClient.ts';
import { SshDiagnosticClient, PREDEFINED_SSH_COMMANDS } from '../layers/protocol/ssh/SshDiagnosticClient.ts';
import { CredentialStore } from '../layers/protocol/security/CredentialStore.ts';
import { LocalDatabase } from '../layers/storage/watermelon/database.ts';
import { OutboxQueue } from '../layers/sync/OutboxQueue.ts';

interface Props {
  selectedDevice?: Dispositivo | null;
}

export const SnmpSshScreen: React.FC<Props> = ({ selectedDevice }) => {
  const [targetIp, setTargetIp] = useState(selectedDevice ? selectedDevice.ip : '192.168.1.1');
  const [community, setCommunity] = useState('public');
  const [snmpLoading, setSnmpLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<SnmpTelemetry | null>(null);

  const [sshLoading, setSshLoading] = useState(false);
  const [sshResults, setSshResults] = useState<SshExecutionResult[]>([]);

  const handleQuerySnmp = async () => {
    setSnmpLoading(true);
    try {
      const data = await SnmpClient.queryOids(targetIp, 161, community);
      setTelemetry(data);

      await LocalDatabase.saveDiagnostic({
        id: `DIAG-SNMP-${Date.now()}`,
        deviceIp: targetIp,
        snmpTelemetry: data,
        timestamp: new Date().toISOString(),
      });

      await OutboxQueue.enqueue('DIAGNOSTIC', {
        type: 'SNMP',
        targetIp,
        telemetry: data,
      });
    } catch (err: any) {
      alert(err.message || 'Error en consulta SNMP');
    } finally {
      setSnmpLoading(false);
    }
  };

  const handleRunSsh = async (commandStr: string) => {
    setSshLoading(true);
    try {
      const creds = await CredentialStore.getCredentials(targetIp);
      const res = await SshDiagnosticClient.executeCommand(
        creds || { host: targetIp, port: 22, username: 'admin' },
        commandStr
      );

      setSshResults((prev) => [res, ...prev]);

      await LocalDatabase.saveDiagnostic({
        id: `DIAG-SSH-${Date.now()}`,
        deviceIp: targetIp,
        sshResult: res,
        timestamp: new Date().toISOString(),
      });

      await OutboxQueue.enqueue('DIAGNOSTIC', {
        type: 'SSH',
        targetIp,
        result: res,
      });
    } catch (err: any) {
      alert(err.message || 'Error en ejecución SSH');
    } finally {
      setSshLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Diagnóstico de Protocolos (SNMP & SSH)</Text>
        <Text style={styles.subtitle}>Consultas binarias sobre UDP/161 y consola remota segura</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Dispositivo Objetivo</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={targetIp}
            onChangeText={setTargetIp}
            placeholder="IP de Destino"
            placeholderTextColor="#64748b"
          />
          <TextInput
            style={[styles.input, { width: 90 }]}
            value={community}
            onChangeText={setCommunity}
            placeholder="Community"
            placeholderTextColor="#64748b"
          />
        </View>

        <TouchableOpacity
          style={[styles.actionButton, snmpLoading && styles.disabledButton]}
          onPress={handleQuerySnmp}
          disabled={snmpLoading}
        >
          {snmpLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Consultar OIDs SNMP (MIB-II)</Text>
          )}
        </TouchableOpacity>
      </View>

      {telemetry && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Telemetría SNMP Recibida (v2c / UDP 161)</Text>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryKey}>sysName (1.3.6.1.2.1.1.5.0):</Text>
            <Text style={styles.telemetryVal}>{telemetry.sysName}</Text>
          </View>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryKey}>sysUpTime (1.3.6.1.2.1.1.3.0):</Text>
            <Text style={styles.telemetryVal}>{telemetry.sysUpTime}</Text>
          </View>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryKey}>sysDescr (1.3.6.1.2.1.1.1.0):</Text>
            <Text style={styles.telemetryVal}>{telemetry.sysDescr}</Text>
          </View>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryKey}>Tráfico Entrante (ifInOctets):</Text>
            <Text style={styles.telemetryVal}>{(telemetry.ifInOctets / (1024 * 1024)).toFixed(2)} MB</Text>
          </View>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryKey}>Tráfico Saliente (ifOutOctets):</Text>
            <Text style={styles.telemetryVal}>{(telemetry.ifOutOctets / (1024 * 1024)).toFixed(2)} MB</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Comandos SSH Predefinidos (Cliente Embebido)</Text>
        <View style={styles.cmdList}>
          {PREDEFINED_SSH_COMMANDS.map((cmd) => (
            <TouchableOpacity
              key={cmd.id}
              style={[styles.cmdButton, sshLoading && styles.disabledButton]}
              onPress={() => handleRunSsh(cmd.command)}
              disabled={sshLoading}
            >
              <Text style={styles.cmdLabel}>{cmd.label}</Text>
              <Text style={styles.cmdCode}>$ {cmd.command}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {sshResults.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Terminal de Salida SSH</Text>
          {sshResults.map((r, i) => (
            <View key={i} style={styles.terminalBox}>
              <Text style={styles.terminalHeader}>
                $ {r.command} ({r.durationMs}ms)
              </Text>
              <Text style={styles.terminalText}>{r.output}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  header: {
    marginBottom: 4,
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
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  telemetryItem: {
    marginBottom: 8,
  },
  telemetryKey: {
    fontSize: 11,
    color: '#94a3b8',
  },
  telemetryVal: {
    fontSize: 13,
    color: '#f1f5f9',
    fontWeight: '600',
    marginTop: 2,
  },
  cmdList: {
    gap: 8,
  },
  cmdButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    padding: 10,
  },
  cmdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  cmdCode: {
    fontSize: 11,
    color: '#10b981',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  terminalBox: {
    backgroundColor: '#000000',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  terminalHeader: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  terminalText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
