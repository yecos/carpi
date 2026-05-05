import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/materials/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const material = await db.material.update({
      where: { id },
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
        active: body.active,
        priceUpdatedAt: body.priceUpdatedAt ? new Date(body.priceUpdatedAt) : new Date(),
      },
      include: { supplier: true },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json({ error: 'Error al actualizar material' }, { status: 500 });
  }
}

// DELETE /api/materials/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const material = await db.material.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json({ error: 'Error al eliminar material' }, { status: 500 });
  }
}
