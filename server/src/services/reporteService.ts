import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { Cliente, Cuota, Pago, Prestamo } from '@prisma/client';
import { formatoMoneda } from '../lib/format';

type CuotaConPagos = Cuota & { pagos: Pago[] };
type PrestamoConDetalle = Prestamo & { cliente: Cliente; cuotas: CuotaConPagos[] };

function formatoFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function generarReportePrestamoPDF(
  prestamo: PrestamoConDetalle,
  saldoPendiente: number,
  generadoPor: string,
  res: Response,
) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="prestamo-${prestamo.id}-${prestamo.cliente.documento}.pdf"`,
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').text('Prestadiario', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Reporte de préstamo', { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(14).font('Helvetica-Bold').text(prestamo.cliente.nombre);
  doc.fontSize(10).font('Helvetica').fillColor('#555555').text(`Documento: ${prestamo.cliente.documento}`);
  doc.fillColor('#000000');
  doc.moveDown(1);

  const resumen: [string, string][] = [
    ['Tasa mensual', `${prestamo.tasaMensual}%`],
    ['Capital', formatoMoneda(prestamo.capital)],
    ['Interés', formatoMoneda(prestamo.montoInteres)],
    ['Total', formatoMoneda(prestamo.montoTotal)],
    ['Saldo pendiente', formatoMoneda(saldoPendiente)],
  ];

  doc.fontSize(11).font('Helvetica-Bold').text('Resumen del préstamo');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  for (const [etiqueta, valor] of resumen) {
    doc.text(`${etiqueta}: `, { continued: true }).font('Helvetica-Bold').text(valor).font('Helvetica');
  }
  doc.moveDown(1.2);

  doc.fontSize(11).font('Helvetica-Bold').text('Cuotas pagadas');
  doc.moveDown(0.4);

  const columnas = { cuota: 50, fecha: 130, valor: 260 };
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Cuota', columnas.cuota, doc.y, { continued: false });
  doc.text('Fecha', columnas.fecha, doc.y - doc.currentLineHeight());
  doc.text('Valor', columnas.valor, doc.y - doc.currentLineHeight());
  doc.moveDown(0.3);
  doc
    .moveTo(50, doc.y)
    .lineTo(400, doc.y)
    .strokeColor('#cccccc')
    .stroke();
  doc.moveDown(0.3);

  const pagos = prestamo.cuotas.flatMap((cuota) =>
    cuota.pagos.map((pago) => ({ numero: cuota.numero, fecha: pago.fecha, monto: pago.monto })),
  );
  pagos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  doc.font('Helvetica');
  if (pagos.length === 0) {
    doc.fillColor('#555555').text('Sin pagos registrados todavía.', columnas.cuota);
    doc.fillColor('#000000');
  } else {
    for (const pago of pagos) {
      const y = doc.y;
      doc.text(`Cuota ${pago.numero}`, columnas.cuota, y);
      doc.text(formatoFecha(pago.fecha), columnas.fecha, y);
      doc.text(formatoMoneda(pago.monto), columnas.valor, y);
      doc.moveDown(0.5);
    }
  }

  doc.moveDown(1.5);
  doc
    .fontSize(8)
    .fillColor('#888888')
    .text(
      `Generado por ${generadoPor} el ${new Date().toLocaleString('es-CO')}`,
      { align: 'right' },
    );

  doc.end();
}
