import { Dispositivo } from '../../../types/device.types.ts';
import { RegistroInstalacion } from '../../../types/installation.types.ts';
import { SnmpTelemetry } from '../../../types/snmp.types.ts';
import { SshExecutionResult } from '../../../types/ssh.types.ts';

export interface DiagnosticoLocal {
  id: string;
  deviceIp: string;
  snmpTelemetry?: SnmpTelemetry;
  sshResult?: SshExecutionResult;
  timestamp: string;
}

export class LocalDatabase {
  private static STORAGE_PREFIX = 'tp6_telecom_db_';

  static async saveDevice(device: Dispositivo): Promise<void> {
    const devices = await this.getDevices();
    const existingIndex = devices.findIndex((d) => d.ip === device.ip);
    if (existingIndex >= 0) {
      devices[existingIndex] = device;
    } else {
      devices.push(device);
    }
    this.persist('devices', devices);
  }

  static async getDevices(): Promise<Dispositivo[]> {
    return this.retrieve<Dispositivo[]>('devices') || [];
  }

  static async saveDiagnostic(diagnostic: DiagnosticoLocal): Promise<void> {
    const diagnostics = await this.getDiagnostics();
    diagnostics.unshift(diagnostic);
    this.persist('diagnostics', diagnostics);
  }

  static async getDiagnostics(): Promise<DiagnosticoLocal[]> {
    return this.retrieve<DiagnosticoLocal[]>('diagnostics') || [];
  }

  static async saveInstallation(installation: RegistroInstalacion): Promise<void> {
    const list = await this.getInstallations();
    const idx = list.findIndex((i) => i.id === installation.id);
    if (idx >= 0) {
      list[idx] = installation;
    } else {
      list.unshift(installation);
    }
    this.persist('installations', list);
  }

  static async getInstallations(): Promise<RegistroInstalacion[]> {
    return this.retrieve<RegistroInstalacion[]>('installations') || [];
  }

  private static persist(key: string, data: any): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(data));
    }
  }

  private static retrieve<T>(key: string): T | null {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  }
}
