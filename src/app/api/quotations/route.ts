import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/quotations?status=BORRADOR&archiiTenantId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const archiiTenantId = searchParams.get('archiiTenantId') || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (archiiTenantId) where.archiiTenantId = archiiTenantId;

    const quotations = await db.quotation.findMany({
      where,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            template: true,
            material: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 });
  }
}

// POST /api/quotations
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const subtotal = body.items?.reduce(
      (sum: number, item: { subtotal?: number }) => sum + (item.subtotal || 0) * (item.quantity || 1),
      0
    ) || 0;
    const margin = body.margin ?? 25;
    const total = subtotal * (1 + margin / 100);

    const archiiTenantId = body.archiiTenantId || undefined;

    const quotation = await db.quotation.create({
      data: {
        clientName: body.clientName,
        clientId: body.clientId || null,
        project: body.project,
        location: body.location || null,
        notes: body.notes || null,
        subtotal,
        margin,
        total,
        status: body.status || 'BORRADOR',
        archiiTenantId: archiiTenantId || null,
        archiiProjectId: body.archiiProjectId || null,
        items: {
          create: (body.items || []).map(
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

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 });
  }
}
