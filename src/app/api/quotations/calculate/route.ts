import { db } from '@/lib/db';
import { calculateQuotationItem, calculateGenericEstimate } from '@/lib/calculations';
import { NextResponse } from 'next/server';

// POST /api/quotations/calculate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, width, height, depth, materialType, finishType, furnitureType } = body;

    if (!width || !height) {
      return NextResponse.json(
        { error: 'width y height son requeridos' },
        { status: 400 }
      );
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

    // If templateId is provided, do precise calculation
    if (templateId) {
      const template = await db.furnitureTemplate.findUnique({
        where: { id: templateId },
        include: { components: { orderBy: { sortOrder: 'asc' } } },
      });

      if (!template) {
        return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
      }

      const componentInputs = template.components.map(comp => ({
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
      }));

      const result = calculateQuotationItem(
        componentInputs,
        materialPrices,
        width,
        height,
        depth || 0,
        materialType
      );

      return NextResponse.json({
        templateName: template.name,
        templateType: template.type,
        dimensions: { width, height, depth: depth || 0 },
        materialType,
        finishType,
        ...result,
      });
    }

    // NO templateId — do generic estimated calculation based on dimensions
    const result = calculateGenericEstimate(
      materialPrices,
      width,
      height,
      depth || 0,
      materialType,
      furnitureType
    );

    return NextResponse.json({
      templateName: furnitureType || 'Mueble personalizado',
      templateType: furnitureType || 'OTRO',
      dimensions: { width, height, depth: depth || 0 },
      materialType,
      finishType,
      estimated: true, // Flag: this is an estimate, not precise
      ...result,
    });
  } catch (error) {
    console.error('Error calculating quotation:', error);
    return NextResponse.json({ error: 'Error al calcular cotización' }, { status: 500 });
  }
}
