import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/materials?category=TABLERO
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') !== 'false';

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (activeOnly) where.active = true;

    const materials = await db.material.findMany({
      where,
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Error al obtener materiales' }, { status: 500 });
  }
}

// POST /api/materials
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const material = await db.material.create({
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        price: body.price,
        supplierId: body.supplierId || null,
        notes: body.notes || null,
        thickness: body.thickness || null,
        width: body.width || null,
        length: body.length || null,
        color: body.color || null,
        materialType: body.materialType || null,
        active: body.active !== false,
        priceUpdatedAt: body.priceUpdatedAt ? new Date(body.priceUpdatedAt) : new Date(),
      },
      include: { supplier: true },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json({ error: 'Error al crear material' }, { status: 500 });
  }
}
