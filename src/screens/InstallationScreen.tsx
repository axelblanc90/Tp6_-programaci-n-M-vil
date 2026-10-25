import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { FichaTecnica } from '../types/device.types.ts';
import { FotoEvidencia, GeoLocationData, RegistroInstalacion } from '../types/installation.types.ts';
import { QrScannerService } from '../layers/evidence/QrScannerService.ts';
import { GeoLocationService } from '../layers/evidence/GeoLocationService.ts';
import { CameraService } from '../layers/evidence/CameraService.ts';
import { LocalDatabase } from '../layers/storage/watermelon/database.ts';
import { OutboxQueue } from '../layers/sync/OutboxQueue.ts';
import { PdfReportGenerator } from '../layers/reporting/PdfReportGenerator.ts';

export const InstallationScreen: React.FC = () => {
  const [deviceCode, setDeviceCode] = useState('CISCO-2960X-48TS');
  const [siteName, setSiteName] = useState('Nodo Central - Planta Baja');
  const [technicianName, setTechnicianName] = useState('Ing. Axel Blanc');
  const [notes, setNotes] = useState('Equipo fijado en Rack 02. Parcheo de enlaces de fibra óptica completado.');

  const [loadingSheet, setLoadingSheet] = useState(false);
  const [technicalSheet, setTechnicalSheet] = useState<FichaTecnica | null>(null);

  const [geoData, setGeoData] = useState<GeoLocationData | null>(null);
  const [photo, setPhoto] = useState<FotoEvidencia | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleScanQr = async (code: string) => {
    setDeviceCode(code);
    setLoadingSheet(true);
    try {
      const sheet = await QrScannerService.resolveTechnicalSheet(code);
      setTechnicalSheet(sheet);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleCaptureEvidence = async () => {
    const loc = await GeoLocationService.getCurrentLocation();
    setGeoData(loc);

    const capturedPhoto = CameraService.capturePhotoWithWatermark(siteName, loc);
    setPhoto(capturedPhoto);
  };

  const handleSaveInstallation = async () => {
    if (!geoData) {
      alert('Por favor capture la evidencia fotográfica y coordenadas GPS antes de guardar.');
      return;
    }

    setIsSaving(true);
    try {
      const installation: RegistroInstalacion = {
        id: `INST-${Date.now()}`,
        deviceIp: '192.168.1.10',
        deviceMac: '00:1A:2B:3C:4D:0A',
        deviceCode,
        technicalSheet: technicalSheet || undefined,
        siteName,
        technicianName,
        notes,
        photos: photo ? [photo] : [],
        location: geoData,
        createdAt: new Date().toISOString(),
        synced: false,
      };

      await LocalDatabase.saveInstallation(installation);

      await OutboxQueue.enqueue('INSTALLATION', installation);

      alert('Instalación registrada localmente en WatermelonDB y encolada en Outbox.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!geoData) {
      alert('Se requiere evidencia fotográfica y georreferenciación para generar el PDF.');
      return;
    }

    const dummyInstallation: RegistroInstalacion = {
      id: `INST-${Date.now()}`,
      deviceIp: '192.168.1.10',
      deviceMac: '00:1A:2B:3C:4D:0A',
      deviceCode,
      technicalSheet: technicalSheet || undefined,
      siteName,
      technicianName,
      notes,
      photos: photo ? [photo] : [],
      location: geoData,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    await PdfReportGenerator.generateReport(dummyInstallation);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Instalación & Evidencia</Text>
        <Text style={styles.subtitle}>Ficha técnica QR, fotos georreferenciadas y reporte formal PDF</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Identificación QR / Código de Barras (RF-04)</Text>
        <View style={styles.sampleButtons}>
          <TouchableOpacity
            style={styles.sampleChip}
            onPress={() => handleScanQr('CISCO-2960X-48TS')}
          >
            <Text style={styles.sampleChipText}>QR: Cisco Switch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sampleChip}
            onPress={() => handleScanQr('MIKROTIK-CCR1009')}
          >
            <Text style={styles.sampleChipText}>QR: MikroTik Router</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sampleChip}
            onPress={() => handleScanQr('HUAWEI-HG8245H')}
          >
            <Text style={styles.sampleChipText}>QR: Huawei ONT</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          value={deviceCode}
          onChangeText={setDeviceCode}
          placeholder="Código escaneado"
          placeholderTextColor="#64748b"
        />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleScanQr(deviceCode)}
          disabled={loadingSheet}
        >
          {loadingSheet ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Consultar Ficha Técnica Remota</Text>
          )}
        </TouchableOpacity>

        {technicalSheet && (
          <View style={styles.sheetBox}>
            <Text style={styles.sheetModel}>{technicalSheet.model}</Text>
            <Text style={styles.sheetDetail}>Fabricante: {technicalSheet.vendor} ({technicalSheet.type})</Text>
            <Text style={styles.sheetDetail}>Puertos: {technicalSheet.ports}</Text>
            <Text style={styles.sheetDetail}>Firmware: {technicalSheet.firmware} | Consumo: {technicalSheet.powerConsumption}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Evidencia de Campo (Foto + GPS - RF-05)</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleCaptureEvidence}>
          <Text style={styles.actionButtonText}>Capturar Foto y Posicionamiento GPS</Text>
        </TouchableOpacity>

        {geoData && (
          <View style={styles.geoBox}>
            <Text style={styles.geoText}>
              Lat: {geoData.latitude} | Long: {geoData.longitude} (±{geoData.accuracy}m)
            </Text>
            <Text style={styles.geoTime}>Timestamp GPS: {new Date(geoData.timestamp).toLocaleTimeString()}</Text>
          </View>
        )}

        {photo && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="contain" />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Datos de Visita Técnica</Text>
        <TextInput
          style={styles.input}
          value={siteName}
          onChangeText={setSiteName}
          placeholder="Nombre del Sitio o Nodo"
          placeholderTextColor="#64748b"
        />
        <TextInput
          style={styles.input}
          value={technicianName}
          onChangeText={setTechnicianName}
          placeholder="Nombre del Técnico"
          placeholderTextColor="#64748b"
        />
        <TextInput
          style={[styles.input, { height: 70 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observaciones y notas técnicas"
          placeholderTextColor="#64748b"
          multiline
        />

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveInstallation}
            disabled={isSaving}
          >
            <Text style={styles.actionButtonText}>Guardar en WatermelonDB (Offline)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.pdfButton]}
            onPress={handleExportPdf}
          >
            <Text style={styles.actionButtonText}>Exportar Reporte PDF (RF-06)</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  sampleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  sampleChip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  sampleChipText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sheetBox: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
  },
  sheetModel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sheetDetail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 3,
  },
  geoBox: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  geoText: {
    color: '#22c55e',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  geoTime: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  photoContainer: {
    marginTop: 10,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  photoPreview: {
    width: '100%',
    height: 180,
  },
  buttonsRow: {
    gap: 8,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  pdfButton: {
    backgroundColor: '#dc2626',
  },
});
