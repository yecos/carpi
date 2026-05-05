import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/furniture?type=COCINA
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: Record<string, unknown> = { active: true };
    if (type) where.type = type;

    const templates = await db.furnitureTemplate.findMany({
      where,
      include: {
        components: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching furniture templates:', error);
    return NextResponse.json({ error: 'Error al obtener plantillas' }, { status: 500 });
  }
}

// POST /api/furniture
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const template = await db.furnitureTemplate.create({
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

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating furniture template:', error);
    return NextResponse.json({ error: 'Error al crear plantilla' }, { status: 500 });
  }
}
