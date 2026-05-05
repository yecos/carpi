import { db } from '@/lib/db';
import { calculateQuotationItem } from '@/lib/calculations';
import { NextResponse } from 'next/server';

// POST /api/quotations/calculate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, width, height, depth, materialType, finishType } = body;

    if (!templateId || !width || !height) {
      return NextResponse.json(
        { error: 'templateId, width y height son requeridos' },
        { status: 400 }
      );
    }

    // Get template with components
    const template = await db.furnitureTemplate.findUnique({
      where: { id: templateId },
      include: { components: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    // Get all active materials for calculation
    const { searchParams } = new URL(request.url);
    const archiiTenantId = searchParams.get('archiiTenantId') || undefined;

    const where: Record<string, unknown> = { active: true };
    if (archiiTenantId) where.archiiTenantId = archiiTenantId;

    const materials = await db.material.findMany({ where });

    const materialPrices = materials.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      unit: m.unit,
      price: m.price,
      materialType: m.materialType || undefined,
    }));

    // Map components to calculation input
    const componentInputs = template.components.map(comp => {
      let hardwareList: Array<{ id: string; qty: number }> | undefined;
      if (comp.hardwareList) {
        try {
          hardwareList = JSON.parse(comp.hardwareList);
        } catch {
          hardwareList = undefined;
        }
      }

      return {
        name: comp.name,
        quantity: comp.quantity,
        widthFormula: comp.widthFormula,
        heightFormula: comp.heightFormula,
        depthFormula: comp.depthFormula || undefined,
        materialCategory: comp.materialCategory,
        materialId: comp.materialId || undefined,
        needsEdge: comp.needsEdge,
        edgeSides: comp.edgeSides,
        edgeType: comp.edgeType || undefined,
        hardwareList: comp.hardwareList || undefined,
        laborHours: comp.laborHours,
      };
    });

    const result = calculateQuotationItem(
      componentInputs,
      materialPrices,
      width,
      height,
      depth || 0,
      materialType
    );

    // Add template info and finish type to the result
    const response = {
      templateName: template.name,
      templateType: template.type,
      dimensions: { width, height, depth: depth || 0 },
      materialType,
      finishType,
      ...result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating quotation:', error);
    return NextResponse.json({ error: 'Error al calcular cotización' }, { status: 500 });
  }
}
