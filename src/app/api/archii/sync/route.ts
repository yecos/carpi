import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncQuotationToArchii } from '@/lib/archii-service';

// POST /api/archii/sync - Sync a quotation to Archii
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quotationId, apiKey: bodyApiKey } = body;

    const apiKey = bodyApiKey || request.headers.get('X-Archii-Api-Key') || '';

    if (!quotationId) {
      return NextResponse.json(
        { error: 'Se requiere quotationId' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Se requiere API Key' },
        { status: 401 }
      );
    }

    // Fetch the quotation with items
    const quotation = await db.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: {
            template: { select: { name: true, type: true } },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    if (!quotation.archiiTenantId || !quotation.archiiProjectId) {
      return NextResponse.json(
        { error: 'La cotización no tiene proyecto de Archii asociado' },
        { status: 400 }
      );
    }

    // Prepare payload for Archii
    const payload = {
      quotationId: quotation.id,
      archiiTenantId: quotation.archiiTenantId,
      archiiProjectId: quotation.archiiProjectId,
      clientName: quotation.clientName,
      project: quotation.project,
      location: quotation.location || undefined,
      subtotal: quotation.subtotal,
      margin: quotation.margin,
      total: quotation.total,
      status: quotation.status,
      items: quotation.items.map((item) => ({
        name: item.customName || item.template?.name || 'Sin nombre',
        width: item.width,
        height: item.height,
        depth: item.depth || undefined,
        quantity: item.quantity,
        materialType: item.materialType || undefined,
        finishType: item.finishType || undefined,
        subtotal: item.subtotal,
      })),
      currency: 'COP',
    };

    // Sync to Archii
    const result = await syncQuotationToArchii(payload, apiKey);

    if (result.success) {
      // Update the quotation with sync info
      await db.quotation.update({
        where: { id: quotationId },
        data: {
          archiiSyncedAt: new Date(),
          archiiWebhookId: result.webhookId || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Cotización sincronizada con Archii',
        webhookId: result.webhookId,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Error al sincronizar con Archii' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error syncing quotation to Archii:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar con Archii' },
      { status: 500 }
    );
  }
}
