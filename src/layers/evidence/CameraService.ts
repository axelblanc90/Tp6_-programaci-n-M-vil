import { FotoEvidencia, GeoLocationData } from '../../types/installation.types.ts';

export class CameraService {
  static capturePhotoWithWatermark(caption: string, geo: GeoLocationData): FotoEvidencia {
    // Genera una muestra fotográfica de rack/instalación con sello de agua georreferenciado
    const photoId = `PHOTO-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // SVG renderizado en Data URI para previsualización inmediata en reporte y app
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#1e293b"/>
        <rect x="40" y="40" width="520" height="320" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
        <rect x="70" y="70" width="460" height="45" rx="4" fill="#334155"/>
        <circle cx="100" cy="92" r="8" fill="#22c55e"/>
        <circle cx="130" cy="92" r="8" fill="#22c55e"/>
        <circle cx="160" cy="92" r="8" fill="#eab308"/>
        <rect x="70" y="130" width="460" height="45" rx="4" fill="#334155"/>
        <circle cx="100" cy="152" r="8" fill="#22c55e"/>
        <circle cx="130" cy="152" r="8" fill="#22c55e"/>
        <rect x="70" y="190" width="460" height="45" rx="4" fill="#334155"/>
        <text x="300" y="270" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">RACK DE TELECOMUNICACIONES - NODO DE ACCESO</text>
        <!-- Marca de Agua Georreferenciada -->
        <rect x="40" y="310" width="520" height="50" fill="rgba(0,0,0,0.7)"/>
        <text x="55" y="330" fill="#38bdf8" font-family="monospace" font-size="11">GPS: ${geo.latitude}, ${geo.longitude} (±${geo.accuracy}m)</text>
        <text x="55" y="348" fill="#f8fafc" font-family="monospace" font-size="11">FECHA: ${timestamp} | REF: ${caption}</text>
      </svg>
    `;

    const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;

    return {
      id: photoId,
      uri,
      timestamp,
      caption,
      geo,
    };
  }
}
