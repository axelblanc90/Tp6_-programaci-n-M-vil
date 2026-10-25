export interface SnmpVarBind {
  oid: string;
  type: number;
  value: string | number;
  typeName: string;
}

export interface SnmpTelemetry {
  sysName: string;
  sysUpTime: string;
  sysDescr: string;
  ifInOctets: number;
  ifOutOctets: number;
  queriedAt: string;
  community: string;
  rawVarBinds: SnmpVarBind[];
}

export const STANDARD_OIDS = {
  SYS_DESCR: '1.3.6.1.2.1.1.1.0',
  SYS_UPTIME: '1.3.6.1.2.1.1.3.0',
  SYS_NAME: '1.3.6.1.2.1.1.5.0',
  IF_IN_OCTETS: '1.3.6.1.2.1.2.2.1.10.1',
  IF_OUT_OCTETS: '1.3.6.1.2.1.2.2.1.16.1',
};
