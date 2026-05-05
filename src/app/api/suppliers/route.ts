import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/suppliers?archiiTenantId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archiiTenantId = searchParams.get('archiiTenantId') || undefined;

    const where: Record<string, unknown> = { active: true };
    if (archiiTenantId) where.archiiTenantId = archiiTenantId;

    const suppliers = await db.supplier.findMany({
      where,
      include: {
        _count: { select: { materials: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}

// POST /api/suppliers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const archiiTenantId = body.archiiTenantId || undefined;

    const supplier = await db.supplier.create({
      data: {
        name: body.name,
        contact: body.contact || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        active: body.active !== false,
        archiiTenantId: archiiTenantId || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}
