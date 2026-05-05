import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archiiTenantId = searchParams.get('archiiTenantId') || undefined;

    const where: Record<string, unknown> = { active: true };
    if (archiiTenantId) where.archiiTenantId = archiiTenantId;

    const materials = await db.material.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: [{ materialType: 'asc' }, { name: 'asc' }],
    });

    // Group by materialType, then show prices from different suppliers
    const grouped: Record<string, Record<string, { materialId: string; materialName: string; supplierId: string; supplierName: string; price: number; unit: string }[]>> = {};
    
    for (const m of materials) {
      const type = m.materialType || 'Sin tipo';
      if (!grouped[type]) grouped[type] = {};
      if (!grouped[type][m.name]) grouped[type][m.name] = [];
      
      grouped[type][m.name].push({
        materialId: m.id,
        materialName: m.name,
        supplierId: m.supplier?.id || '',
        supplierName: m.supplier?.name || 'Sin proveedor',
        price: m.price,
        unit: m.unit,
      });
    }

    // Get unique suppliers for column headers
    const supplierWhere: Record<string, unknown> = { active: true };
    if (archiiTenantId) supplierWhere.archiiTenantId = archiiTenantId;

    const suppliers = await db.supplier.findMany({
      where: supplierWhere,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ grouped, suppliers });
  } catch (error) {
    console.error('Error comparing materials:', error);
    return NextResponse.json({ error: 'Error al comparar materiales' }, { status: 500 });
  }
}
