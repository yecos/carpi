import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/clients?archiiTenantId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archiiTenantId = searchParams.get('archiiTenantId') || undefined;

    const where: Record<string, unknown> = { active: true };
    if (archiiTenantId) where.archiiTenantId = archiiTenantId;

    const clients = await db.client.findMany({
      where,
      include: {
        _count: { select: { quotations: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const archiiTenantId = body.archiiTenantId || undefined;

    const client = await db.client.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
        archiiTenantId: archiiTenantId || null,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
