# 🚀 Guía de Ejecución y Puesta en Marcha — TP6

**Proyecto:** Network Diagnostics Suite (Toolkit móvil de telecomunicaciones para técnicos de campo)

---

## 📋 Requisitos Previos

1. **Node.js**: v18 o v20 LTS instalado (verificado: `v20.18.0`).
2. **NPM**: v9 o superior (verificado: `10.8.2`).
3. **Navegador web moderno** (para validación interactiva inmediata) o **Android Studio con SDK configurado** (para compilación de APK nativo).

---

## 🖥️ Paso 1: Iniciar el Backend Stub de Referencia

El backend stub provee los servicios requeridos por la consigna:
- Servidor HTTP en el puerto `3001` (`/api/sync`, `/api/devices/:code`, `/api/ssh/execute`).
- Agente emulador SNMP nativo en el puerto `UDP 161` (con fallback a `UDP 1161`).

1. Abre una terminal dentro de la carpeta `tp6`:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. Verás en la consola:
   ```text
   [HTTP SERVER] Servidor escuchando en http://0.0.0.0:3001
     - Healthcheck:     http://localhost:3001/health
     - Ficha Técnica:   http://localhost:3001/api/devices/CISCO-2960X-48TS
     - Outbox Sync:     http://localhost:3001/api/sync
     - SSH Mock Exec:   http://localhost:3001/api/ssh/execute
   [SNMP AGENT] Agente SNMP activo en UDP 0.0.0.0:161
   ```

---

## 📱 Paso 2: Ejecutar la Aplicación

### Opción A: Modo Interactivo Web (Recomendado para Pruebas y Corrección)
Permite probar de inmediato todos los flujos de la consigna sin requerir dispositivo físico conectado por USB:

1. En la raíz de `tp6`, instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
3. Abre el navegador en `http://localhost:5174`.



## 🧪 Paso 3: Guía Rápida de Validación de Requisitos (Paso a Paso)

### 1. Descubrimiento LAN (RF-01)
- Ve a la pestaña **"Descubrir"**.
- Selecciona el método **"Barrido ARP"** o **"mDNS / Bonjour"** y haz clic en **"Escanear Red Local"**.
- Observa la lista de dispositivos descubiertos (IP, MAC, hostname, fabricante). Haz clic en cualquiera de ellos para pasar automáticamente al diagnóstico.

### 2. Telemetría SNMP y Consola SSH (RF-02 y RF-03)
- Ve a la pestaña **"SNMP / SSH"**.
- Haz clic en **"Consultar OIDs SNMP (MIB-II)"**: el parser ASN.1 BER consultará por UDP el agente y desplegará `sysName`, `sysUpTime`, `sysDescr` y el tráfico de interfaces `ifInOctets`/`ifOutOctets`.
- En la sección inferior, selecciona cualquier comando predefinido (`uptime`, `show ip interface brief`, `show ip route`) para ejecutar diagnósticos remotos seguros.

### 3. Ficha Técnica por QR y Evidencia de Campo (RF-04 y RF-05)
- Ve a la pestaña **"Instalación"**.
- Toca uno de los botones de prueba (`QR: Cisco Switch`, `QR: MikroTik Router` o ingresa un código propio) y presiona **"Consultar Ficha Técnica Remota"** para asociar las especificaciones de fábrica.
- Presiona **"Capturar Foto y Posicionamiento GPS"** para obtener las coordenadas satelitales en tiempo real y la foto de rack con marca de agua indeleble.

### 4. Prueba del Modo Offline-First y Patrón Outbox (RF-07)
1. En la barra superior, presiona **"Simular Offline"** (el indicador cambiará a rojo: `OFFLINE (MODO CAMPO)`).
2. Presiona **"Guardar en WatermelonDB (Offline)"**: verás que el registro se guarda en la base local sin errores y el badge superior aumentará (`Cola Outbox: 1 pendientes`).
3. Presiona **"Restaurar Red"**: la suite detectará conectividad y sincronizará automáticamente el lote retenido contra el endpoint `POST /api/sync` del backend, vaciando la cola.

### 5. Generación de Reporte PDF (RF-06)
- En la pantalla de Instalación o desde el **"Historial"**, presiona **"Exportar Reporte PDF"**.
- Se abrirá la plantilla formal de ingeniería de telecomunicaciones con el logotipo, datos del técnico, coordenadas georreferenciadas, telemetría SNMP y registro fotográfico.

### 6. Consulta de Historial Offline (RF-08)
- Ve a la pestaña **"Historial"** para consultar todos los equipos, diagnósticos e instalaciones persistidos localmente en WatermelonDB sin depender de conexión a Internet.
