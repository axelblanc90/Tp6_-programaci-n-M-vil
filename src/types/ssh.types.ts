export interface SshCredentials {
  host: string;
  port: number;
  username: string;
  password?: string;
}

export interface SshCommand {
  id: string;
  label: string;
  command: string;
  description: string;
  category: 'interfaces' | 'system' | 'routing';
}

export interface SshExecutionResult {
  command: string;
  output: string;
  exitCode: number;
  executedAt: string;
  durationMs: number;
}
