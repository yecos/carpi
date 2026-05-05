import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const original = await db.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!original) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Create duplicate with BORRADOR status
    const duplicate = await db.quotation.create({
      data: {
        clientName: original.clientName + ' (copia)',
        clientId: original.clientId,
        project: original.project,
        location: original.location,
        notes: original.notes,
        subtotal: original.subtotal,
        margin: original.margin,
        total: original.total,
        status: 'BORRADOR',
        items: {
          create: original.items.map((item) => ({
            templateId: item.templateId,
            customName: item.customName,
            width: item.width,
            height: item.height,
            depth: item.depth,
            quantity: item.quantity,
            materialId: item.materialId,
            materialType: item.materialType,
            finishType: item.finishType,
            subtotal: item.subtotal,
            detail: item.detail,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error('Error duplicating quotation:', error);
    return NextResponse.json({ error: 'Error al duplicar cotización' }, { status: 500 });
  }
}
