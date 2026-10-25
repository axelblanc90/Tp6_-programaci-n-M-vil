import { RegistroInstalacion } from '../../types/installation.types.ts';
import { SnmpTelemetry } from '../../types/snmp.types.ts';
import { ReportTemplate } from './ReportTemplate.ts';

export class PdfReportGenerator {
  static async generateReport(installation: RegistroInstalacion, snmp?: SnmpTelemetry): Promise<string> {
    const htmlContent = ReportTemplate.generateHtml(installation, snmp);

    // En entorno nativo móvil usa react-native-html-to-pdf:
    // const options = { html: htmlContent, fileName: `reporte_${installation.id}`, directory: 'Documents' };
    // const file = await RNHTMLtoPDF.convert(options);
    // return file.filePath;

    // En entorno web/desarrollo genera una descarga o apertura directa
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      }
      return url;
    }

    return 'pdf-generated-successfully';
  }
}
