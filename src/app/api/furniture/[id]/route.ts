import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/furniture/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db.furnitureTemplate.findUnique({
      where: { id },
      include: {
        components: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching furniture template:', error);
    return NextResponse.json({ error: 'Error al obtener plantilla' }, { status: 500 });
  }
}

// PUT /api/furniture/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Delete existing components and recreate
    await db.furnitureComponent.deleteMany({ where: { templateId: id } });

    const template = await db.furnitureTemplate.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        description: body.description || null,
        components: {
          create: (body.components || []).map(
            (c: Record<string, unknown>, i: number) => ({
              name: c.name as string,
              quantity: c.quantity as number,
              widthFormula: c.widthFormula as string,
              heightFormula: c.heightFormula as string,
              depthFormula: (c.depthFormula as string) || null,
              materialCategory: c.materialCategory as string,
              materialId: (c.materialId as string) || null,
              needsEdge: c.needsEdge as boolean,
              edgeSides: c.edgeSides as number,
              edgeType: (c.edgeType as string) || null,
              hardwareList: c.hardwareList ? JSON.stringify(c.hardwareList) : null,
              laborHours: (c.laborHours as number) || 0,
              sortOrder: i,
            })
          ),
        },
      },
      include: { components: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating furniture template:', error);
    return NextResponse.json({ error: 'Error al actualizar plantilla' }, { status: 500 });
  }
}

// DELETE /api/furniture/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db.furnitureTemplate.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error deleting furniture template:', error);
    return NextResponse.json({ error: 'Error al eliminar plantilla' }, { status: 500 });
  }
}
