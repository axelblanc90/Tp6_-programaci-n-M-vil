import { FichaTecnica } from './device.types.ts';

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  timestamp: string;
}

export interface FotoEvidencia {
  id: string;
  uri: string;
  base64?: string;
  timestamp: string;
  caption: string;
  geo: GeoLocationData;
}

export interface RegistroInstalacion {
  id: string;
  deviceIp: string;
  deviceMac: string;
  deviceCode: string;
  technicalSheet?: FichaTecnica;
  siteName: string;
  technicianName: string;
  notes: string;
  photos: FotoEvidencia[];
  location: GeoLocationData;
  createdAt: string;
  synced: boolean;
}
