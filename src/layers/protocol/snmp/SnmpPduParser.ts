import { SnmpVarBind } from '../../../types/snmp.types.ts';

const BER_TAGS = {
  INTEGER: 0x02,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OBJECT_IDENTIFIER: 0x06,
  SEQUENCE: 0x30,
  IP_ADDRESS: 0x40,
  COUNTER32: 0x41,
  GAUGE32: 0x42,
  TIMETICKS: 0x43,
  GET_REQUEST_PDU: 0xa0,
  GET_RESPONSE_PDU: 0xa2,
};

export class SnmpPduParser {
  static buildGetRequest(community: string = 'public', requestId: number = 1001, oids: string[]): Uint8Array {
    const varBindBuffers: Uint8Array[] = [];
    for (const oid of oids) {
      const oidEncoded = this.encodeOid(oid);
      const nullValue = new Uint8Array([BER_TAGS.NULL, 0x00]);
      const varBind = this.wrapInTlv(
        BER_TAGS.SEQUENCE,
        this.concatBuffers([oidEncoded, nullValue])
      );
      varBindBuffers.push(varBind);
    }
    const varBindList = this.wrapInTlv(BER_TAGS.SEQUENCE, this.concatBuffers(varBindBuffers));

    const reqIdBuf = this.encodeInteger(requestId);
    const errStatusBuf = this.encodeInteger(0);
    const errIndexBuf = this.encodeInteger(0);

    const pduBody = this.concatBuffers([reqIdBuf, errStatusBuf, errIndexBuf, varBindList]);
    const pdu = this.wrapInTlv(BER_TAGS.GET_REQUEST_PDU, pduBody);

    const versionBuf = this.encodeInteger(1); // v2c
    const communityBuf = this.encodeOctetString(community);

    const messageBody = this.concatBuffers([versionBuf, communityBuf, pdu]);
    return this.wrapInTlv(BER_TAGS.SEQUENCE, messageBody);
  }

  static parseResponse(buffer: Uint8Array): { requestId: number; varbinds: SnmpVarBind[] } {
    let offset = 0;

    if (buffer[offset++] !== BER_TAGS.SEQUENCE) {
      throw new Error('Formato ASN.1 no válido: la raíz no es una SEQUENCE.');
    }
    offset = this.skipLength(buffer, offset);

    if (buffer[offset++] !== BER_TAGS.INTEGER) {
      throw new Error('Se esperaba tag INTEGER para la versión de SNMP.');
    }
    const versionLen = buffer[offset++];
    offset += versionLen;

    if (buffer[offset++] !== BER_TAGS.OCTET_STRING) {
      throw new Error('Se esperaba tag OCTET STRING para la community.');
    }
    const communityLen = buffer[offset++];
    offset += communityLen;

    const pduTag = buffer[offset++];
    if (pduTag !== BER_TAGS.GET_RESPONSE_PDU && pduTag !== 0xa0) {
      throw new Error(`Se esperaba GetResponse PDU (0xA2), recibido: 0x${pduTag.toString(16)}`);
    }
    offset = this.skipLength(buffer, offset);

    if (buffer[offset++] !== BER_TAGS.INTEGER) throw new Error('Se esperaba tag de RequestID.');
    const reqIdLen = buffer[offset++];
    let requestId = 0;
    for (let i = 0; i < reqIdLen; i++) {
      requestId = (requestId << 8) | buffer[offset++];
    }

    offset += 3; // error-status
    offset += 3; // error-index

    if (buffer[offset++] !== BER_TAGS.SEQUENCE) throw new Error('Se esperaba SEQUENCE de VarBindList.');
    offset = this.skipLength(buffer, offset);

    const varbinds: SnmpVarBind[] = [];

    while (offset < buffer.length) {
      if (buffer[offset++] !== BER_TAGS.SEQUENCE) break;
      offset = this.skipLength(buffer, offset);

      if (buffer[offset++] !== BER_TAGS.OBJECT_IDENTIFIER) break;
      const oidLen = buffer[offset++];
      const oidBytes = buffer.slice(offset, offset + oidLen);
      offset += oidLen;
      const oid = this.decodeOid(oidBytes);

      const valTag = buffer[offset++];
      const valLen = buffer[offset++];
      const valBytes = buffer.slice(offset, offset + valLen);
      offset += valLen;

      let value: string | number = '';
      let typeName = 'UNKNOWN';

      switch (valTag) {
        case BER_TAGS.OCTET_STRING:
          value = new TextDecoder('utf-8').decode(valBytes);
          typeName = 'STRING';
          break;
        case BER_TAGS.INTEGER:
        case BER_TAGS.COUNTER32:
        case BER_TAGS.GAUGE32:
        case BER_TAGS.TIMETICKS:
          let num = 0;
          for (let b of valBytes) num = (num << 8) | b;
          value = num;
          typeName = valTag === BER_TAGS.TIMETICKS ? 'TIMETICKS' : 'INTEGER/COUNTER';
          break;
        default:
          value = `Tag 0x${valTag.toString(16)}`;
      }

      varbinds.push({ oid, type: valTag, value, typeName });
    }

    return { requestId, varbinds };
  }

  private static encodeInteger(val: number): Uint8Array {
    let bytes: number[] = [];
    let n = val;
    do {
      bytes.unshift(n & 0xff);
      n >>= 8;
    } while (n > 0);

    if (bytes[0] & 0x80) bytes.unshift(0x00);
    return new Uint8Array([BER_TAGS.INTEGER, bytes.length, ...bytes]);
  }

  private static encodeOctetString(str: string): Uint8Array {
    const bytes = new TextEncoder().encode(str);
    return this.wrapInTlv(BER_TAGS.OCTET_STRING, bytes);
  }

  private static encodeOid(oid: string): Uint8Array {
    const parts = oid.split('.').map(Number);
    const subIds: number[] = [(parts[0] * 40) + parts[1]];

    for (let i = 2; i < parts.length; i++) {
      let val = parts[i];
      if (val < 128) {
        subIds.push(val);
      } else {
        const temp: number[] = [];
        temp.unshift(val & 0x7f);
        val >>= 7;
        while (val > 0) {
          temp.unshift((val & 0x7f) | 0x80);
          val >>= 7;
        }
        subIds.push(...temp);
      }
    }
    return this.wrapInTlv(BER_TAGS.OBJECT_IDENTIFIER, new Uint8Array(subIds));
  }

  private static decodeOid(bytes: Uint8Array): string {
    if (bytes.length === 0) return '';
    const first = bytes[0];
    const parts: number[] = [Math.floor(first / 40), first % 40];

    let current = 0;
    for (let i = 1; i < bytes.length; i++) {
      const b = bytes[i];
      current = (current << 7) | (b & 0x7f);
      if ((b & 0x80) === 0) {
        parts.push(current);
        current = 0;
      }
    }
    return parts.join('.');
  }

  private static wrapInTlv(tag: number, content: Uint8Array): Uint8Array {
    const len = content.length;
    let lenBytes: number[] = [];
    if (len < 128) {
      lenBytes = [len];
    } else if (len < 256) {
      lenBytes = [0x81, len];
    } else {
      lenBytes = [0x82, (len >> 8) & 0xff, len & 0xff];
    }

    const res = new Uint8Array(1 + lenBytes.length + len);
    res[0] = tag;
    res.set(lenBytes, 1);
    res.set(content, 1 + lenBytes.length);
    return res;
  }

  private static skipLength(buf: Uint8Array, offset: number): number {
    const first = buf[offset++];
    if ((first & 0x80) === 0) return offset;
    const numBytes = first & 0x7f;
    return offset + numBytes;
  }

  private static concatBuffers(arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((acc, a) => acc + a.length, 0);
    const res = new Uint8Array(total);
    let off = 0;
    for (const a of arrays) {
      res.set(a, off);
      off += a.length;
    }
    return res;
  }
}
