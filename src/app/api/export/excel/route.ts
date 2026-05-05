import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();

    if (type === 'materials') {
      const materials = await db.material.findMany({
        where: { active: true },
        include: { supplier: { select: { name: true } } },
        orderBy: { name: 'asc' },
      });

      const rows = materials.map(m => ({
        Nombre: m.name,
        Categoria: m.category,
        Tipo: m.materialType || '',
        Unidad: m.unit,
        Precio: m.price,
        Proveedor: m.supplier?.name || '',
        Espesor: m.thickness || '',
        Color: m.color || '',
      }));

      return NextResponse.json({ data: rows, filename: 'materiales' });
    }

    if (type === 'quotations') {
      const quotations = await db.quotation.findMany({
        include: { items: true, client: true },
        orderBy: { createdAt: 'desc' },
      });

      const rows = quotations.map(q => ({
        Cliente: q.clientName,
        Proyecto: q.project,
        Ubicacion: q.location || '',
        Items: q.items.length,
        Subtotal: q.subtotal,
        Margen: q.margin + '%',
        Total: q.total,
        Estado: q.status,
        Fecha: new Date(q.createdAt).toLocaleDateString('es-CO'),
      }));

      return NextResponse.json({ data: rows, filename: 'cotizaciones' });
    }

    if (type === 'clients') {
      const clients = await db.client.findMany({
        where: { active: true },
        include: { _count: { select: { quotations: true } } },
        orderBy: { name: 'asc' },
      });

      const rows = clients.map(c => ({
        Nombre: c.name,
        Telefono: c.phone || '',
        Email: c.email || '',
        Direccion: c.address || '',
        Cotizaciones: c._count.quotations,
      }));

      return NextResponse.json({ data: rows, filename: 'clientes' });
    }

    return NextResponse.json({ error: 'Tipo de exportación no válido' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting:', error);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}
