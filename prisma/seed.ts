import { PrismaClient, MaterialCategory, FurnitureType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Clean existing data
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.furnitureComponent.deleteMany();
  await prisma.furnitureTemplate.deleteMany();
  await prisma.material.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.client.deleteMany();

  // ============================================
  // 1. CREATE SUPPLIERS
  // ============================================
  console.log('📦 Creando proveedores...');
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Maderas del Valle',
        contact: 'Carlos Ramírez',
        phone: '+57 602 555 0101',
        email: 'ventas@maderasdelvalle.com',
        address: 'Cra 15 #28-45, Cali, Valle',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Tableros Colombia',
        contact: 'María López',
        phone: '+57 601 555 0202',
        email: 'pedidos@tableroscolombia.com',
        address: 'Cll 72 #15-20, Bogotá, Cundinamarca',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Herrajes Express',
        contact: 'Andrés Martínez',
        phone: '+57 604 555 0303',
        email: 'info@herrajesexpress.com',
        address: 'Cra 50 #10-15, Medellín, Antioquia',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Acabados Premium',
        contact: 'Lucía Fernández',
        phone: '+57 601 555 0404',
        email: 'contacto@acabadospremium.com',
        address: 'Av. El Dorado #68-50, Bogotá, Cundinamarca',
      },
    }),
  ]);

  // ============================================
  // 1.5 CREATE CLIENTS
  // ============================================
  console.log('👥 Creando clientes...');
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'María Alejandra Gutiérrez',
        phone: '+57 301 555 0101',
        email: 'maria.gutierrez@email.com',
        address: 'Cra 24 #56-78, Cali, Valle',
        notes: 'Cliente frecuente, proyectos de cocina',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Juan Carlos Mejía',
        phone: '+57 310 555 0202',
        email: 'jc.mejia@email.com',
        address: 'Cll 80 #15-20, Bogotá, Cundinamarca',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Ana Patricia López',
        phone: '+57 320 555 0303',
        email: 'ana.lopez@email.com',
        address: 'Cra 45 #10-30, Medellín, Antioquia',
        notes: 'Prefiere madera natural y acabados premium',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Roberto Castillo',
        phone: '+57 315 555 0404',
        email: 'roberto.castillo@email.com',
        address: 'Av. Santander #22-15, Bucaramanga, Santander',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Laura Valentina Ríos',
        phone: '+57 318 555 0505',
        email: 'laura.rios@email.com',
        address: 'Cll 12 #8-45, Pereira, Risaralda',
        notes: 'Proyectos de interiorismo residencial',
      },
    }),
  ]);

  // ============================================
  // 2. CREATE MATERIALS
  // ============================================
  console.log('🪵 Creando materiales...');
  const materials = await Promise.all([
    // TABLEROS
    prisma.material.create({
      data: {
        name: 'MDF 15mm',
        category: MaterialCategory.TABLERO,
        unit: 'm2',
        price: 45000,
        supplierId: suppliers[0].id,
        thickness: 15,
        materialType: 'MDF',
        color: 'Natural',
      },
    }),
    prisma.material.create({
      data: {
        name: 'MDF 18mm',
        category: MaterialCategory.TABLERO,
        unit: 'm2',
        price: 52000,
        supplierId: suppliers[0].id,
        thickness: 18,
        materialType: 'MDF',
        color: 'Natural',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Melamina 15mm Blanco',
        category: MaterialCategory.TABLERO,
        unit: 'm2',
        price: 38000,
        supplierId: suppliers[1].id,
        thickness: 15,
        materialType: 'Melamina',
        color: 'Blanco',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Melamina 18mm Roble',
        category: MaterialCategory.TABLERO,
        unit: 'm2',
        price: 44000,
        supplierId: suppliers[1].id,
        thickness: 18,
        materialType: 'Melamina',
        color: 'Roble',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Melamina 15mm Roble',
        category: MaterialCategory.TABLERO,
        unit: 'm2',
        price: 40000,
        supplierId: suppliers[1].id,
        thickness: 15,
        materialType: 'Melamina',
        color: 'Roble',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Madera Natural Roble 18mm',
        category: MaterialCategory.TABLERO,
        unit: 'm2',
        price: 120000,
        supplierId: suppliers[0].id,
        thickness: 18,
        materialType: 'Madera',
        color: 'Roble',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Madera Natural Cedro 18mm',
        category: MaterialCategory.TABLERO,
        unit: 'm2',
        price: 95000,
        supplierId: suppliers[0].id,
        thickness: 18,
        materialType: 'Madera',
        color: 'Cedro',
      },
    }),
    // CANTOS
    prisma.material.create({
      data: {
        name: 'Canto PVC 0.8mm Blanco',
        category: MaterialCategory.CANTO,
        unit: 'ml',
        price: 3500,
        supplierId: suppliers[1].id,
        thickness: 0.8,
        materialType: 'PVC',
        color: 'Blanco',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Canto PVC 2mm Blanco',
        category: MaterialCategory.CANTO,
        unit: 'ml',
        price: 5200,
        supplierId: suppliers[1].id,
        thickness: 2,
        materialType: 'PVC',
        color: 'Blanco',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Canto PVC 0.8mm Roble',
        category: MaterialCategory.CANTO,
        unit: 'ml',
        price: 3800,
        supplierId: suppliers[1].id,
        thickness: 0.8,
        materialType: 'PVC',
        color: 'Roble',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Canto PVC 2mm Roble',
        category: MaterialCategory.CANTO,
        unit: 'ml',
        price: 5500,
        supplierId: suppliers[1].id,
        thickness: 2,
        materialType: 'PVC',
        color: 'Roble',
      },
    }),
    // HERRAJES
    prisma.material.create({
      data: {
        name: 'Bisagra 35mm',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 8500,
        supplierId: suppliers[2].id,
        materialType: 'Bisagra',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Corredera 450mm',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 35000,
        supplierId: suppliers[2].id,
        materialType: 'Corredera',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Corredera 550mm',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 42000,
        supplierId: suppliers[2].id,
        materialType: 'Corredera',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Tirador Aluminio 128mm',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 12000,
        supplierId: suppliers[2].id,
        materialType: 'Tirador',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Tirador Aluminio 160mm',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 15000,
        supplierId: suppliers[2].id,
        materialType: 'Tirador',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Soporte estante metálico',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 4500,
        supplierId: suppliers[2].id,
        materialType: 'Soporte',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Tornillo confirmat 5x50',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 350,
        supplierId: suppliers[2].id,
        materialType: 'Tornillo',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Minifix cuerpo',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 1200,
        supplierId: suppliers[2].id,
        materialType: 'Minifix',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Minifix taco',
        category: MaterialCategory.HERRAJE,
        unit: 'unidad',
        price: 800,
        supplierId: suppliers[2].id,
        materialType: 'Minifix',
      },
    }),
    // ACABADOS
    prisma.material.create({
      data: {
        name: 'Pintura Lacado',
        category: MaterialCategory.ACABADO,
        unit: 'm2',
        price: 28000,
        supplierId: suppliers[3].id,
        materialType: 'Lacado',
        color: 'Blanco',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Barniz Natural',
        category: MaterialCategory.ACABADO,
        unit: 'm2',
        price: 22000,
        supplierId: suppliers[3].id,
        materialType: 'Barniz',
        color: 'Natural',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Pintura Poliuretano',
        category: MaterialCategory.ACABADO,
        unit: 'm2',
        price: 35000,
        supplierId: suppliers[3].id,
        materialType: 'Poliuretano',
        color: 'Varios',
      },
    }),
    // MANO DE OBRA
    prisma.material.create({
      data: {
        name: 'Mano de obra corte',
        category: MaterialCategory.MANO_OBRA,
        unit: 'hora',
        price: 15000,
        supplierId: null,
        materialType: 'Corte',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Mano de obra ensamble',
        category: MaterialCategory.MANO_OBRA,
        unit: 'hora',
        price: 18000,
        supplierId: null,
        materialType: 'Ensamble',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Mano de obra instalación',
        category: MaterialCategory.MANO_OBRA,
        unit: 'hora',
        price: 22000,
        supplierId: null,
        materialType: 'Instalación',
      },
    }),
  ]);

  // Find specific materials for component references
  const bisagra = materials.find(m => m.name === 'Bisagra 35mm')!;
  const corredera450 = materials.find(m => m.name === 'Corredera 450mm')!;
  const tirador128 = materials.find(m => m.name === 'Tirador Aluminio 128mm')!;
  const tirador160 = materials.find(m => m.name === 'Tirador Aluminio 160mm')!;
  const soporteEstante = materials.find(m => m.name === 'Soporte estante metálico')!;
  const minifxCuerpo = materials.find(m => m.name === 'Minifix cuerpo')!;
  const minifixTaco = materials.find(m => m.name === 'Minifix taco')!;

  // ============================================
  // 3. CREATE FURNITURE TEMPLATES WITH COMPONENTS
  // ============================================
  console.log('🪑 Creando plantillas de mobiliario...');

  // 1. Módulo Cocina Base
  await prisma.furnitureTemplate.create({
    data: {
      name: 'Módulo Cocina Base',
      type: FurnitureType.COCINA,
      description: 'Módulo base para cocina con puerta y repisa interior. Dimensiones estándar: 600mm ancho x 720mm alto x 580mm profundidad.',
      components: {
        create: [
          { name: 'Lateral izquierdo', quantity: 1, widthFormula: 'profundidad - 4', heightFormula: 'alto - 100', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.3, sortOrder: 0 },
          { name: 'Lateral derecho', quantity: 1, widthFormula: 'profundidad - 4', heightFormula: 'alto - 100', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.3, sortOrder: 1 },
          { name: 'Fondo', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'alto - 100', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: false, edgeSides: 0, laborHours: 0.2, sortOrder: 2 },
          { name: 'Repisa inferior', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'profundidad - 4', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.2, sortOrder: 3 },
          { name: 'Puerta', quantity: 1, widthFormula: 'ancho - 4', heightFormula: 'alto - 4', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 4, edgeType: 'PVC', laborHours: 0.5, sortOrder: 4 },
          { name: 'Zócalo frontal', quantity: 1, widthFormula: 'ancho - 36', heightFormula: '100', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.1, sortOrder: 5 },
          { name: 'Herrajes - Bisagras', quantity: 2, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: bisagra.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: bisagra.id, qty: 1 }]), laborHours: 0.1, sortOrder: 6 },
          { name: 'Herrajes - Tirador', quantity: 1, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: tirador128.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: tirador128.id, qty: 1 }]), laborHours: 0.05, sortOrder: 7 },
          { name: 'Herrajes - Minifijes', quantity: 8, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: minifxCuerpo.id, qty: 1 }, { id: minifixTaco.id, qty: 1 }]), laborHours: 0.15, sortOrder: 8 },
        ],
      },
    },
  });

  // 2. Módulo Cocina Alto
  await prisma.furnitureTemplate.create({
    data: {
      name: 'Módulo Cocina Alto',
      type: FurnitureType.COCINA,
      description: 'Módulo superior para cocina (alacena) con puerta. Dimensiones estándar: 600mm ancho x 720mm alto x 350mm profundidad.',
      components: {
        create: [
          { name: 'Lateral izquierdo', quantity: 1, widthFormula: 'profundidad - 4', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.3, sortOrder: 0 },
          { name: 'Lateral derecho', quantity: 1, widthFormula: 'profundidad - 4', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.3, sortOrder: 1 },
          { name: 'Fondo', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'alto', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: false, edgeSides: 0, laborHours: 0.2, sortOrder: 2 },
          { name: 'Tapa superior', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'profundidad - 4', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.2, sortOrder: 3 },
          { name: 'Repisa interior', quantity: 2, widthFormula: 'ancho - 36', heightFormula: 'profundidad - 20', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.2, sortOrder: 4 },
          { name: 'Puerta', quantity: 2, widthFormula: '(ancho - 8) / 2', heightFormula: 'alto - 4', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 4, edgeType: 'PVC', laborHours: 0.5, sortOrder: 5 },
          { name: 'Herrajes - Bisagras', quantity: 4, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: bisagra.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: bisagra.id, qty: 1 }]), laborHours: 0.15, sortOrder: 6 },
          { name: 'Herrajes - Tiradores', quantity: 2, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: tirador128.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: tirador128.id, qty: 1 }]), laborHours: 0.05, sortOrder: 7 },
          { name: 'Herrajes - Soportes repisa', quantity: 4, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: soporteEstante.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: soporteEstante.id, qty: 1 }]), laborHours: 0.05, sortOrder: 8 },
        ],
      },
    },
  });

  // 3. Módulo Closet
  await prisma.furnitureTemplate.create({
    data: {
      name: 'Módulo Closet',
      type: FurnitureType.CLOSET,
      description: 'Módulo de closet con división interior, repisas y barra colgadora. Dimensiones estándar: 800mm ancho x 2400mm alto x 600mm profundidad.',
      components: {
        create: [
          { name: 'Lateral izquierdo', quantity: 1, widthFormula: 'profundidad', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 3, edgeType: 'PVC', laborHours: 0.4, sortOrder: 0 },
          { name: 'Lateral derecho', quantity: 1, widthFormula: 'profundidad', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 3, edgeType: 'PVC', laborHours: 0.4, sortOrder: 1 },
          { name: 'Fondo', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'alto', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: false, edgeSides: 0, laborHours: 0.3, sortOrder: 2 },
          { name: 'Tapa superior', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'profundidad', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.2, sortOrder: 3 },
          { name: 'Divisor central', quantity: 1, widthFormula: 'profundidad', heightFormula: 'alto - 18', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.3, sortOrder: 4 },
          { name: 'Repisas', quantity: 4, widthFormula: 'ancho - 36', heightFormula: 'profundidad - 18', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.3, sortOrder: 5 },
          { name: 'Puertas', quantity: 2, widthFormula: '(ancho - 4) / 2', heightFormula: 'alto - 4', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 4, edgeType: 'PVC', laborHours: 0.8, sortOrder: 6 },
          { name: 'Zócalo', quantity: 1, widthFormula: 'ancho - 36', heightFormula: '80', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.1, sortOrder: 7 },
          { name: 'Herrajes - Bisagras', quantity: 6, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: bisagra.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: bisagra.id, qty: 1 }]), laborHours: 0.2, sortOrder: 8 },
          { name: 'Herrajes - Tiradores', quantity: 2, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: tirador160.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: tirador160.id, qty: 1 }]), laborHours: 0.05, sortOrder: 9 },
          { name: 'Herrajes - Soportes repisa', quantity: 8, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: soporteEstante.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: soporteEstante.id, qty: 1 }]), laborHours: 0.1, sortOrder: 10 },
        ],
      },
    },
  });

  // 4. Vanidad Baño
  await prisma.furnitureTemplate.create({
    data: {
      name: 'Vanidad Baño',
      type: FurnitureType.BANO,
      description: 'Vanidad para baño con cajones y puerta. Dimensiones estándar: 900mm ancho x 800mm alto x 500mm profundidad.',
      components: {
        create: [
          { name: 'Lateral izquierdo', quantity: 1, widthFormula: 'profundidad - 4', heightFormula: 'alto - 40', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.3, sortOrder: 0 },
          { name: 'Lateral derecho', quantity: 1, widthFormula: 'profundidad - 4', heightFormula: 'alto - 40', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.3, sortOrder: 1 },
          { name: 'Fondo', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'alto - 40', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: false, edgeSides: 0, laborHours: 0.2, sortOrder: 2 },
          { name: 'Tapa', quantity: 1, widthFormula: 'ancho', heightFormula: 'profundidad', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 4, edgeType: 'PVC', laborHours: 0.4, sortOrder: 3 },
          { name: 'Repisa interior', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'profundidad - 4', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.2, sortOrder: 4 },
          { name: 'Puerta', quantity: 1, widthFormula: 'ancho - 4', heightFormula: 'alto - 40', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 4, edgeType: 'PVC', laborHours: 0.5, sortOrder: 5 },
          { name: 'Frente cajón', quantity: 1, widthFormula: 'ancho - 4', heightFormula: '150', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 4, edgeType: 'PVC', laborHours: 0.3, sortOrder: 6 },
          { name: 'Herrajes - Bisagras', quantity: 2, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: bisagra.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: bisagra.id, qty: 1 }]), laborHours: 0.1, sortOrder: 7 },
          { name: 'Herrajes - Corredera', quantity: 1, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: corredera450.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: corredera450.id, qty: 1 }]), laborHours: 0.15, sortOrder: 8 },
          { name: 'Herrajes - Tiradores', quantity: 2, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: tirador128.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: tirador128.id, qty: 1 }]), laborHours: 0.05, sortOrder: 9 },
        ],
      },
    },
  });

  // 5. Mueble TV
  await prisma.furnitureTemplate.create({
    data: {
      name: 'Mueble TV',
      type: FurnitureType.SALA,
      description: 'Mueble para TV con repisas y cajones. Dimensiones estándar: 1800mm ancho x 500mm alto x 450mm profundidad.',
      components: {
        create: [
          { name: 'Lateral izquierdo', quantity: 1, widthFormula: 'profundidad', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 3, edgeType: 'PVC', laborHours: 0.3, sortOrder: 0 },
          { name: 'Lateral derecho', quantity: 1, widthFormula: 'profundidad', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 3, edgeType: 'PVC', laborHours: 0.3, sortOrder: 1 },
          { name: 'Fondo', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'alto', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: false, edgeSides: 0, laborHours: 0.3, sortOrder: 2 },
          { name: 'Tapa superior', quantity: 1, widthFormula: 'ancho', heightFormula: 'profundidad', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 3, edgeType: 'PVC', laborHours: 0.3, sortOrder: 3 },
          { name: 'Divisor central', quantity: 1, widthFormula: 'profundidad - 4', heightFormula: 'alto - 36', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.2, sortOrder: 4 },
          { name: 'Repisas', quantity: 2, widthFormula: 'ancho - 36', heightFormula: 'profundidad - 4', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.2, sortOrder: 5 },
          { name: 'Frentes cajones', quantity: 2, widthFormula: '(ancho - 8) / 2', heightFormula: '150', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 4, edgeType: 'PVC', laborHours: 0.4, sortOrder: 6 },
          { name: 'Herrajes - Correderas', quantity: 2, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: corredera450.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: corredera450.id, qty: 1 }]), laborHours: 0.2, sortOrder: 7 },
          { name: 'Herrajes - Tiradores', quantity: 2, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: tirador128.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: tirador128.id, qty: 1 }]), laborHours: 0.05, sortOrder: 8 },
        ],
      },
    },
  });

  // 6. Estantería
  await prisma.furnitureTemplate.create({
    data: {
      name: 'Estantería',
      type: FurnitureType.OFICINA,
      description: 'Estantería con repisas fijas. Dimensiones estándar: 1200mm ancho x 2000mm alto x 350mm profundidad.',
      components: {
        create: [
          { name: 'Lateral izquierdo', quantity: 1, widthFormula: 'profundidad', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 3, edgeType: 'PVC', laborHours: 0.4, sortOrder: 0 },
          { name: 'Lateral derecho', quantity: 1, widthFormula: 'profundidad', heightFormula: 'alto', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 3, edgeType: 'PVC', laborHours: 0.4, sortOrder: 1 },
          { name: 'Fondo', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'alto', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: false, edgeSides: 0, laborHours: 0.3, sortOrder: 2 },
          { name: 'Tapa superior', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'profundidad', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.2, sortOrder: 3 },
          { name: 'Base inferior', quantity: 1, widthFormula: 'ancho - 36', heightFormula: 'profundidad', depthFormula: '18', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 2, edgeType: 'PVC', laborHours: 0.2, sortOrder: 4 },
          { name: 'Repisas', quantity: 5, widthFormula: 'ancho - 36', heightFormula: 'profundidad - 4', depthFormula: '15', materialCategory: MaterialCategory.TABLERO, needsEdge: true, edgeSides: 1, edgeType: 'PVC', laborHours: 0.3, sortOrder: 5 },
          { name: 'Herrajes - Soportes repisa', quantity: 10, widthFormula: '0', heightFormula: '0', materialCategory: MaterialCategory.HERRAJE, materialId: soporteEstante.id, needsEdge: false, edgeSides: 0, hardwareList: JSON.stringify([{ id: soporteEstante.id, qty: 1 }]), laborHours: 0.15, sortOrder: 6 },
        ],
      },
    },
  });

  console.log('✅ Seed completado exitosamente!');
  console.log(`   Proveedores: ${suppliers.length}`);
  console.log(`   Clientes: ${clients.length}`);
  console.log(`   Materiales: ${materials.length}`);
  console.log(`   Plantillas: 6`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
