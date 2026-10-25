export const SCHEMA_TABLES = {
  DEVICES: 'devices',
  DIAGNOSTICS: 'diagnostics',
  INSTALLATIONS: 'installations',
  OUTBOX_QUEUE: 'outbox_queue',
};

export const databaseSchema = {
  version: 1,
  tables: [
    {
      name: SCHEMA_TABLES.DEVICES,
      columns: [
        { name: 'ip', type: 'string' },
        { name: 'mac', type: 'string' },
        { name: 'hostname', type: 'string', isOptional: true },
        { name: 'vendor', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'discovery_method', type: 'string' },
        { name: 'last_seen', type: 'number' },
      ],
    },
    {
      name: SCHEMA_TABLES.DIAGNOSTICS,
      columns: [
        { name: 'device_ip', type: 'string' },
        { name: 'sys_name', type: 'string' },
        { name: 'sys_uptime', type: 'string' },
        { name: 'sys_descr', type: 'string' },
        { name: 'ssh_command', type: 'string' },
        { name: 'ssh_output', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    },
    {
      name: SCHEMA_TABLES.INSTALLATIONS,
      columns: [
        { name: 'device_ip', type: 'string' },
        { name: 'device_mac', type: 'string' },
        { name: 'device_code', type: 'string' },
        { name: 'site_name', type: 'string' },
        { name: 'technician_name', type: 'string' },
        { name: 'notes', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'photo_uri', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    },
    {
      name: SCHEMA_TABLES.OUTBOX_QUEUE,
      columns: [
        { name: 'action_type', type: 'string' },
        { name: 'payload_json', type: 'string' },
        { name: 'attempts', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    },
  ],
};
