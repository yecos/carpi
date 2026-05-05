import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/quotations/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quotation = await db.quotation.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            template: { include: { components: { orderBy: { sortOrder: 'asc' } } } },
            material: true,
          },
        },
        client: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Error al obtener cotización' }, { status: 500 });
  }
}

// PUT /api/quotations/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If items are provided, recalculate
    if (body.items) {
      // Delete existing items and recreate
      await db.quotationItem.deleteMany({ where: { quotationId: id } });

      const subtotal = body.items.reduce(
        (sum: number, item: { subtotal?: number; quantity?: number }) => sum + (item.subtotal || 0) * (item.quantity || 1),
        0
      );
      const margin = body.margin ?? 25;
      const total = subtotal * (1 + margin / 100);

      const quotation = await db.quotation.update({
        where: { id },
        data: {
          clientName: body.clientName,
          clientId: body.clientId || null,
          project: body.project,
          location: body.location || null,
          notes: body.notes || null,
          subtotal,
          margin,
          total,
          status: body.status,
          ...(body.archiiTenantId !== undefined && { archiiTenantId: body.archiiTenantId || null }),
          ...(body.archiiProjectId !== undefined && { archiiProjectId: body.archiiProjectId || null }),
          items: {
            create: body.items.map(
              (item: Record<string, unknown>, i: number) => ({
                templateId: (item.templateId as string) || null,
                customName: (item.customName as string) || null,
                width: item.width as number,
                height: item.height as number,
                depth: (item.depth as number) || null,
                quantity: (item.quantity as number) || 1,
                materialId: (item.materialId as string) || null,
                materialType: (item.materialType as string) || null,
                finishType: (item.finishType as string) || null,
                subtotal: (item.subtotal as number) || 0,
                detail: item.detail ? JSON.stringify(item.detail) : null,
                sortOrder: i,
              })
            ),
          },
        },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: { template: true, material: true },
          },
        },
      });

      return NextResponse.json(quotation);
    } else {
      // Just update status or basic fields
      const quotation = await db.quotation.update({
        where: { id },
        data: {
          clientName: body.clientName,
          clientId: body.clientId,
          project: body.project,
          location: body.location,
          notes: body.notes,
          margin: body.margin,
          status: body.status,
          ...(body.archiiTenantId !== undefined && { archiiTenantId: body.archiiTenantId || null }),
          ...(body.archiiProjectId !== undefined && { archiiProjectId: body.archiiProjectId || null }),
          ...(body.archiiSyncedAt !== undefined && { archiiSyncedAt: body.archiiSyncedAt ? new Date(body.archiiSyncedAt) : null }),
          ...(body.archiiWebhookId !== undefined && { archiiWebhookId: body.archiiWebhookId || null }),
        },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: { template: true, material: true },
          },
        },
      });

      // Recalculate total if margin changed
      if (body.margin !== undefined) {
        const total = quotation.subtotal * (1 + quotation.margin / 100);
        await db.quotation.update({
          where: { id },
          data: { total },
        });
        quotation.total = total;
      }

      return NextResponse.json(quotation);
    }
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: 'Error al actualizar cotización' }, { status: 500 });
  }
}

// DELETE /api/quotations/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete items first
    await db.quotationItem.deleteMany({ where: { quotationId: id } });
    await db.quotation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Error al eliminar cotización' }, { status: 500 });
  }
}
