import { FichaTecnica } from '../../types/device.types.ts';

export class QrScannerService {
  static async resolveTechnicalSheet(code: string): Promise<FichaTecnica> {
    try {
      const response = await fetch(`http://localhost:3001/api/devices/${encodeURIComponent(code)}`);
      if (response.ok) {
        const data = await response.json();
        return data.sheet;
      }
    } catch (_) {
      // Fallback offline si el backend no responde
    }

    const clean = code.toUpperCase().trim();
    if (clean.includes('CISCO')) {
      return {
        model: 'Cisco Catalyst 2960-X 48TS-L',
        vendor: 'Cisco Systems',
        type: 'Switch Capa 2/3',
        ports: '48 x Gigabit Ethernet + 4 x SFP',
        firmware: 'IOS 15.2(4)E7',
        powerConsumption: '45W',
        documentationUrl: 'https://cisco.com/go/2960x',
      };
    }
    if (clean.includes('MIKROTIK')) {
      return {
        model: 'MikroTik CCR1009-7G-1C-1S+',
        vendor: 'MikroTik',
        type: 'Cloud Core Router',
        ports: '7 x Gigabit LAN, 1 x Combo, 1 x SFP+',
        firmware: 'RouterOS v7.14',
        powerConsumption: '34W',
        documentationUrl: 'https://mikrotik.com/product/CCR1009',
      };
    }

    return {
      model: `Equipo Telecom (${code})`,
      vendor: 'Fabricante de Infraestructura',
      type: 'Dispositivo de Red',
      ports: 'Puertos Ethernet estándar',
      firmware: 'v2.4.0-stable',
      powerConsumption: '25W',
      documentationUrl: 'https://specs.telecom.local',
    };
  }
}
