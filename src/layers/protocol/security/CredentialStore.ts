import { SshCredentials } from '../../../types/ssh.types.ts';

export class CredentialStore {
  private static memoryVault: Map<string, SshCredentials> = new Map();

  static async saveCredentials(host: string, credentials: SshCredentials): Promise<void> {
    // En entorno nativo se utiliza react-native-keychain:
    // await Keychain.setGenericPassword(credentials.username, credentials.password, { service: `ssh_${host}` });
    this.memoryVault.set(host, { ...credentials });
  }

  static async getCredentials(host: string): Promise<SshCredentials | null> {
    if (this.memoryVault.has(host)) {
      return this.memoryVault.get(host)!;
    }

    // Credenciales por defecto para equipos de red estándar (sandbox)
    return {
      host,
      port: 22,
      username: 'admin',
      password: '••••••••',
    };
  }

  static async deleteCredentials(host: string): Promise<void> {
    this.memoryVault.delete(host);
  }
}
