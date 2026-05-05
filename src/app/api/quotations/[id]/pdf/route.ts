import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            template: { select: { name: true, type: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        client: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Generate PDF as HTML that will be converted
    const formatDate = (d: Date | string) => {
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCOP = (v: number) => '$ ' + Math.round(v).toLocaleString('es-CO');

    let itemsHtml = '';
    for (const item of quotation.items) {
      const name = item.customName || item.template?.name || 'Sin nombre';
      let breakdownHtml = '';
      
      if (item.detail) {
        try {
          const breakdown = JSON.parse(item.detail);
          breakdownHtml = breakdown.map((b: Record<string, unknown>) => `
            <tr>
              <td style="padding:4px 8px;border-bottom:1px solid #f0e6d3;">${b.componentName || b.name}</td>
              <td style="padding:4px 8px;text-align:center;border-bottom:1px solid #f0e6d3;">${b.quantity}</td>
              <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #f0e6d3;">${formatCOP(b.materialCost as number)}</td>
              <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #f0e6d3;">${formatCOP(b.edgeCost as number)}</td>
              <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #f0e6d3;">${formatCOP(b.hardwareCost as number)}</td>
              <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #f0e6d3;">${formatCOP(b.laborCost as number)}</td>
              <td style="padding:4px 8px;text-align:right;font-weight:600;border-bottom:1px solid #f0e6d3;">${formatCOP(b.subtotal as number)}</td>
            </tr>
          `).join('');
        } catch { /* ignore */ }
      }

      itemsHtml += `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0e6d3;font-weight:500;">${name}</td>
          <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f0e6d3;">${item.quantity}</td>
          <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f0e6d3;font-size:12px;">${item.width}×${item.height}×${item.depth || 0}</td>
          <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f0e6d3;">${item.materialType || '-'}</td>
          <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f0e6d3;">${item.finishType || '-'}</td>
          <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f0e6d3;font-weight:600;">${formatCOP(item.subtotal * item.quantity)}</td>
        </tr>
      `;

      if (breakdownHtml) {
        itemsHtml += `
          <tr><td colspan="6" style="padding:0;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;background:#fefcf8;">
              <thead>
                <tr style="background:#f5efe5;">
                  <th style="padding:3px 8px;text-align:left;">Componente</th>
                  <th style="padding:3px 8px;text-align:center;">Cant</th>
                  <th style="padding:3px 8px;text-align:right;">Material</th>
                  <th style="padding:3px 8px;text-align:right;">Canto</th>
                  <th style="padding:3px 8px;text-align:right;">Herraje</th>
                  <th style="padding:3px 8px;text-align:right;">M.O.</th>
                  <th style="padding:3px 8px;text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${breakdownHtml}</tbody>
            </table>
          </td></tr>
        `;
      }
    }

    const marginAmount = quotation.subtotal * quotation.margin / 100;
    const statusLabels: Record<string, string> = {
      BORRADOR: 'Borrador',
      ENVIADA: 'Enviada',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
    };

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #2d2418; font-size: 13px; line-height: 1.5; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { background: linear-gradient(135deg, #b45309, #92400e); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; font-weight: 700; }
  .header .subtitle { opacity: 0.9; font-size: 14px; margin-top: 4px; }
  .header .date { opacity: 0.8; font-size: 12px; margin-top: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .info-card { background: #fefcf8; border: 1px solid #f0e6d3; border-radius: 8px; padding: 16px; }
  .info-label { font-size: 11px; color: #8b7355; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .info-value { font-size: 14px; font-weight: 500; color: #2d2418; }
  .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #f5efe5; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b5a3e; border-bottom: 2px solid #e8dcc8; }
  thead th:last-child { text-align: right; }
  .totals { margin-left: auto; width: 300px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
  .totals-divider { border-top: 2px solid #e8dcc8; margin: 8px 0; }
  .totals-total { font-size: 18px; font-weight: 700; color: #92400e; }
  .footer { margin-top: 40px; text-align: center; color: #8b7355; font-size: 11px; border-top: 1px solid #f0e6d3; padding-top: 20px; }
  .footer .validity { background: #fef3c7; display: inline-block; padding: 6px 16px; border-radius: 20px; color: #92400e; font-weight: 600; margin-top: 8px; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>Cotización de Carpintería</h1>
    <div class="subtitle">Sistema de Cotizaciones Premium</div>
    <div class="date">${formatDate(quotation.createdAt)} • ${statusLabels[quotation.status] || quotation.status}</div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="info-label">Cliente</div>
      <div class="info-value">${quotation.clientName}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Proyecto</div>
      <div class="info-value">${quotation.project}</div>
    </div>
    ${quotation.location ? `<div class="info-card"><div class="info-label">Ubicación</div><div class="info-value">${quotation.location}</div></div>` : ''}
    ${quotation.client?.phone ? `<div class="info-card"><div class="info-label">Teléfono</div><div class="info-value">${quotation.client.phone}</div></div>` : ''}
    ${quotation.client?.email ? `<div class="info-card"><div class="info-label">Email</div><div class="info-value">${quotation.client.email}</div></div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:center;">Dim. (mm)</th>
        <th style="text-align:center;">Material</th>
        <th style="text-align:center;">Acabado</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatCOP(quotation.subtotal)}</span>
    </div>
    <div class="totals-row">
      <span>Margen (${quotation.margin}%):</span>
      <span>${formatCOP(marginAmount)}</span>
    </div>
    <div class="totals-divider"></div>
    <div class="totals-row totals-total">
      <span>TOTAL:</span>
      <span>${formatCOP(quotation.total)}</span>
    </div>
  </div>

  ${quotation.notes ? `<div style="margin-top:20px;padding:12px;background:#fefcf8;border-radius:8px;border:1px solid #f0e6d3;"><strong>Notas:</strong> ${quotation.notes}</div>` : ''}

  <div class="footer">
    <p>Cotización generada por Cotizador Carpintería</p>
    <div class="validity">Válida por 15 días a partir de la fecha de emisión</div>
  </div>
</div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="cotizacion-${quotation.clientName.replace(/\s+/g, '-').toLowerCase()}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 });
  }
}
