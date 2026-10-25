const express = require('express');
const cors = require('cors');
const dgram = require('dgram');

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const SNMP_PORT = process.env.SNMP_PORT || 161;
const SNMP_FALLBACK_PORT = 1161;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// In-memory sync storage for Outbox pattern validation
const syncedData = {
  batches: [],
  devices: [],
  diagnostics: [],
  installations: []
};

// Remote technical sheets database (RF-04: QR/Barcode association)
const technicalSheets = {
  'CISCO-2960X-48TS': {
    model: 'Cisco Catalyst 2960-X 48TS-L',
    vendor: 'Cisco Systems',
    type: 'Switch Capa 2/3',
    ports: '48 x 10/100/1000 + 4 x 1G SFP',
    firmware: 'IOS 15.2(4)E7',
    powerConsumption: '45W',
    documentationUrl: 'https://cisco.com/go/2960x'
  },
  'MIKROTIK-CCR1009': {
    model: 'MikroTik CCR1009-7G-1C-1S+',
    vendor: 'MikroTik',
    type: 'Cloud Core Router',
    ports: '7 x Gigabit LAN, 1 x Combo, 1 x SFP+',
    firmware: 'RouterOS v7.14',
    powerConsumption: '34W',
    documentationUrl: 'https://mikrotik.com/product/CCR1009'
  },
  'HUAWEI-HG8245H': {
    model: 'EchoLife HG8245H GPON ONT',
    vendor: 'Huawei Technologies',
    type: 'Optical Network Terminal',
    ports: '4 x GE + 2 x POTS + 1 x USB + Wi-Fi',
    firmware: 'V300R017C10SPC115',
    powerConsumption: '18W',
    documentationUrl: 'https://e.huawei.com'
  }
};

// 1. Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Network Diagnostics Suite - Backend Reference Stub',
    timestamp: new Date().toISOString(),
    ports: { http: HTTP_PORT, snmp: SNMP_PORT }
  });
});

// 2. Query Remote Technical Sheet by QR / Barcode (RF-04)
app.get('/api/devices/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const sheet = technicalSheets[code] || {
    model: `Equipo Genérico (${code})`,
    vendor: 'Fabricante de Red',
    type: 'Dispositivo de Telecomunicaciones',
    ports: 'Interfaces Ethernet estándar',
    firmware: 'v1.0.0-field',
    powerConsumption: '25W',
    documentationUrl: 'https://telecom.internal/specs'
  };

  res.json({
    success: true,
    code,
    sheet
  });
});

// 3. Outbox Sync Ingestion Endpoint (RF-07)
app.post('/api/sync', (req, res) => {
  const { batchId, items = [] } = req.body;

  console.log(`[SYNC] Ingestando lote ${batchId || 'desconocido'} con ${items.length} acciones.`);

  items.forEach((item) => {
    if (item.type === 'DEVICE') syncedData.devices.push({ ...item.payload, syncedAt: new Date().toISOString() });
    if (item.type === 'DIAGNOSTIC') syncedData.diagnostics.push({ ...item.payload, syncedAt: new Date().toISOString() });
    if (item.type === 'INSTALLATION') syncedData.installations.push({ ...item.payload, syncedAt: new Date().toISOString() });
  });

  syncedData.batches.push({
    batchId: batchId || `batch-${Date.now()}`,
    itemCount: items.length,
    syncedAt: new Date().toISOString()
  });

  res.status(200).json({
    success: true,
    batchId,
    receivedCount: items.length,
    syncedAt: new Date().toISOString(),
    message: 'Lote sincronizado y persistido con éxito en el servidor central.'
  });
});

// 4. Query All Synced Records (RF-08 validation)
app.get('/api/reports', (req, res) => {
  res.json({
    success: true,
    totalBatches: syncedData.batches.length,
    devices: syncedData.devices,
    diagnostics: syncedData.diagnostics,
    installations: syncedData.installations
  });
});

// 5. Embedded SSH Diagnostic Command Mock (RF-03)
app.post('/api/ssh/execute', (req, res) => {
  const { host, port = 22, command, username } = req.body;

  let output = '';
  switch ((command || '').trim().toLowerCase()) {
    case 'uptime':
      output = ` 21:30:15 up 42 days, 14:02, 1 user, load average: 0.12, 0.08, 0.05`;
      break;
    case 'show interfaces':
    case 'show ip interface brief':
      output = `Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.1.1     YES NVRAM  up                    up      
GigabitEthernet0/1     10.0.40.2       YES NVRAM  up                    up      
GigabitEthernet0/2     unassigned      YES unset  down                  down    
Vlan1                  192.168.1.254   YES manual up                    up      `;
      break;
    case 'show ip route':
      output = `Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP
Gateway of last resort is 192.168.1.1 to network 0.0.0.0
S*    0.0.0.0/0 [1/0] via 192.168.1.1
C     192.168.1.0/24 is directly connected, GigabitEthernet0/0
C     10.0.40.0/24 is directly connected, GigabitEthernet0/1`;
      break;
    default:
      output = `[HOST ${host}:${port}] Ejecución exitosa de '${command}' con usuario '${username}'. Salida estándar normalizada sin errores.`;
  }

  res.json({
    success: true,
    host,
    command,
    timestamp: new Date().toISOString(),
    output
  });
});

// -------------------------------------------------------------
// Embedded UDP SNMP Agent Simulator (Port 161 / 1161)
// Responds with ASN.1 BER Encoded GetResponse for standard MIB-II
// -------------------------------------------------------------
function startSnmpServer(port) {
  const socket = dgram.createSocket('udp4');

  socket.on('error', (err) => {
    console.warn(`[SNMP AGENT] Advertencia en puerto UDP ${port}: ${err.message}`);
    socket.close();
    if (port === SNMP_PORT) {
      console.log(`[SNMP AGENT] Reintentando agente SNMP en puerto alternativo ${SNMP_FALLBACK_PORT}...`);
      startSnmpServer(SNMP_FALLBACK_PORT);
    }
  });

  socket.on('message', (msg, rinfo) => {
    console.log(`[SNMP AGENT] Datagrama SNMP recibido (${msg.length} bytes) de ${rinfo.address}:${rinfo.port}`);
    try {
      const response = buildSnmpResponse(msg);
      socket.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
        if (!err) {
          console.log(`[SNMP AGENT] GetResponse enviado a ${rinfo.address}:${rinfo.port}`);
        }
      });
    } catch (parseErr) {
      console.warn(`[SNMP AGENT] Error generando respuesta: ${parseErr.message}`);
    }
  });

  socket.on('listening', () => {
    const addr = socket.address();
    console.log(`[SNMP AGENT] Agente SNMP activo en UDP ${addr.address}:${addr.port}`);
  });

  try {
    socket.bind(port);
  } catch (err) {
    if (port === SNMP_PORT) startSnmpServer(SNMP_FALLBACK_PORT);
  }
}

function buildSnmpResponse(reqBuffer) {
  let requestId = 1001;
  if (reqBuffer.length > 15) {
    try {
      requestId = reqBuffer.readInt32BE(Math.min(13, reqBuffer.length - 4));
    } catch (_) {}
  }

  const sysName = "SW-CORE-DIST-01";
  const sysDescr = "Cisco Catalyst 2960-X - IOS 15.2(4)E7";

  return Buffer.concat([
    Buffer.from([0x30, 0x82, 0x00, 0x64]), // SEQUENCE
    Buffer.from([0x02, 0x01, 0x01]),       // SNMP v2c (1)
    Buffer.from([0x04, 0x06, 0x70, 0x75, 0x62, 0x6c, 0x69, 0x63]), // "public"
    Buffer.from([0xa2, 0x54]),             // GetResponse PDU
    Buffer.from([0x02, 0x04]), Buffer.alloc(4), // Request ID
    Buffer.from([0x02, 0x01, 0x00]),       // error-status: 0
    Buffer.from([0x02, 0x01, 0x00]),       // error-index: 0
    Buffer.from([0x30, 0x46]),             // VarBindList
    // VarBind 1: sysName (1.3.6.1.2.1.1.5.0)
    Buffer.from([0x30, 0x1f, 0x06, 0x08, 0x2b, 0x06, 0x01, 0x02, 0x01, 0x01, 0x05, 0x00]),
    Buffer.from([0x04, sysName.length]), Buffer.from(sysName),
    // VarBind 2: sysDescr (1.3.6.1.2.1.1.1.0)
    Buffer.from([0x30, 0x21, 0x06, 0x08, 0x2b, 0x06, 0x01, 0x02, 0x01, 0x01, 0x01, 0x00]),
    Buffer.from([0x04, Math.min(sysDescr.length, 20)]), Buffer.from(sysDescr.substring(0, 20))
  ]);
}

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP SERVER] Servidor escuchando en http://0.0.0.0:${HTTP_PORT}`);
  console.log(`  - Healthcheck:     http://localhost:${HTTP_PORT}/health`);
  console.log(`  - Ficha Técnica:   http://localhost:${HTTP_PORT}/api/devices/CISCO-2960X-48TS`);
  console.log(`  - Outbox Sync:     http://localhost:${HTTP_PORT}/api/sync`);
  console.log(`  - SSH Mock Exec:   http://localhost:${HTTP_PORT}/api/ssh/execute`);
});

startSnmpServer(SNMP_PORT);
