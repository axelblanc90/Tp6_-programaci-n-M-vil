export interface Dispositivo {
  id: string;
  ip: string;
  mac: string;
  hostname?: string;
  vendor?: string;
  status: 'online' | 'unreachable';
  discoveryMethod: 'ARP' | 'mDNS' | 'MANUAL';
  lastSeen: string;
}

export interface FichaTecnica {
  model: string;
  vendor: string;
  type: string;
  ports: string;
  firmware: string;
  powerConsumption: string;
  documentationUrl: string;
}
