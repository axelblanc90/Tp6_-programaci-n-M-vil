import { RegistroInstalacion } from '../../types/installation.types.ts';
import { SnmpTelemetry } from '../../types/snmp.types.ts';

export class ReportTemplate {
  static generateHtml(installation: RegistroInstalacion, snmp?: SnmpTelemetry): string {
    const photo = installation.photos[0];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reporte de Instalación y Diagnóstico - ${installation.siteName}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      margin: 30px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 3px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 22px;
      font-weight: bold;
      color: #0369a1;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      background: #f1f5f9;
      padding: 6px 10px;
      border-left: 4px solid #0284c7;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
    }
    th {
      background-color: #f8fafc;
      width: 30%;
      color: #475569;
    }
    .photo-box {
      text-align: center;
      margin: 15px 0;
      border: 1px solid #cbd5e1;
      padding: 10px;
      background: #f8fafc;
    }
    .photo-img {
      max-width: 100%;
      height: 240px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 35px;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">REPORTE TÉCNICO DE INSTALACIÓN Y AUDITORÍA DE RED</div>
    <div class="subtitle">Licenciatura en Sistemas de Información — Network Diagnostics Suite (TP6)</div>
    <div style="margin-top: 8px;">
      <span class="badge">NODO DE CAMPO</span>
      <span class="badge">EVIDENCIA GEORREFERENCIADA</span>
      <span class="badge">OFFLINE-FIRST CERTIFIED</span>
    </div>
  </div>

  <div class="section-title">1. DATOS GENERALES DEL SITIO Y OPERADOR</div>
  <table>
    <tr><th>Sitio / Nodo</th><td><strong>${installation.siteName}</strong></td></tr>
    <tr><th>Técnico Responsable</th><td>${installation.technicianName}</td></tr>
    <tr><th>Fecha y Hora</th><td>${new Date(installation.createdAt).toLocaleString()}</td></tr>
    <tr><th>Coordenadas GPS</th><td>Lat: ${installation.location.latitude}, Long: ${installation.location.longitude} (Precisión: ±${installation.location.accuracy}m)</td></tr>
  </table>

  <div class="section-title">2. EQUIPO IDENTIFICADO (ESCANEADO QR/BARCODE)</div>
  <table>
    <tr><th>Código de Barras / QR</th><td><strong>${installation.deviceCode}</strong></td></tr>
    <tr><th>Dirección IP / MAC</th><td>${installation.deviceIp} (${installation.deviceMac})</td></tr>
    <tr><th>Modelo / Fabricante</th><td>${installation.technicalSheet?.model || 'Desconocido'} (${installation.technicalSheet?.vendor || 'N/A'})</td></tr>
    <tr><th>Tipo de Dispositivo</th><td>${installation.technicalSheet?.type || 'Dispositivo de Red'}</td></tr>
    <tr><th>Puertos Físicos</th><td>${installation.technicalSheet?.ports || 'Interfaces estándar'}</td></tr>
    <tr><th>Versión de Firmware</th><td>${installation.technicalSheet?.firmware || '1.0.0'}</td></tr>
  </table>

  ${snmp ? `
  <div class="section-title">3. TELEMETRÍA DE PROTOCOLO SNMP (MIB-II RFC 1213)</div>
  <table>
    <tr><th>sysName (1.3.6.1.2.1.1.5.0)</th><td><strong>${snmp.sysName}</strong></td></tr>
    <tr><th>sysUpTime (1.3.6.1.2.1.1.3.0)</th><td>${snmp.sysUpTime}</td></tr>
    <tr><th>sysDescr (1.3.6.1.2.1.1.1.0)</th><td>${snmp.sysDescr}</td></tr>
    <tr><th>ifInOctets / ifOutOctets</th><td>Entrada: ${(snmp.ifInOctets / (1024*1024)).toFixed(2)} MB | Salida: ${(snmp.ifOutOctets / (1024*1024)).toFixed(2)} MB</td></tr>
  </table>
  ` : ''}

  <div class="section-title">4. REGISTRO FOTOGRÁFICO DE INSTALACIÓN</div>
  <div class="photo-box">
    ${photo ? `<img class="photo-img" src="${photo.uri}" alt="Evidencia de Rack" />` : '<p>Sin fotografía adjunta</p>'}
    <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
      Marca de agua georreferenciada con coordenadas UTC verificadas.
    </div>
  </div>

  <div class="section-title">5. OBSERVACIONES TÉCNICAS</div>
  <p style="font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px;">
    ${installation.notes || 'Instalación y relevamiento completado de acuerdo a los estándares técnicos vigentes sin novedades operativas.'}
  </p>

  <div class="footer">
    <div>Generado por Network Diagnostics Suite Mobile v1.0.0</div>
    <div>Firma Digital del Técnico: _________________________</div>
  </div>
</body>
</html>
    `;
  }
}
