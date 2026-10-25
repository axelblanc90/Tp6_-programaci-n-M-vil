import { Dispositivo } from '../../types/device.types.ts';

export class BonjourDiscoveryService {
  static async scanServices(): Promise<Dispositivo[]> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return [
      {
        id: '192.168.1.15',
        ip: '192.168.1.15',
        mac: 'E4:8D:8C:33:44:55',
        hostname: 'telecom-switch._ssh._tcp.local',
        vendor: 'Edge-Core Telecom',
        status: 'online',
        discoveryMethod: 'mDNS',
        lastSeen: new Date().toISOString(),
      },
      {
        id: '192.168.1.18',
        ip: '192.168.1.18',
        mac: 'B8:27:EB:12:34:56',
        hostname: 'snmp-probe-station._http._tcp.local',
        vendor: 'Linux SNMP Probe',
        status: 'online',
        discoveryMethod: 'mDNS',
        lastSeen: new Date().toISOString(),
      },
    ];
  }
}
