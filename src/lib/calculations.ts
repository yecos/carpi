/**
 * Motor de cálculos para cotizaciones de carpintería
 */

interface ComponentInput {
  name: string;
  quantity: number;
  widthFormula: string;
  heightFormula: string;
  depthFormula?: string;
  materialCategory: string;
  materialId?: string;
  needsEdge: boolean;
  edgeSides: number;
  edgeType?: string;
  hardwareList?: string;
  laborHours: number;
}

interface MaterialPrice {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  materialType?: string;
}

interface ComponentBreakdown {
  componentName: string;
  quantity: number;
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  materialCost: number;
  edgeCost: number;
  hardwareCost: number;
  laborCost: number;
  subtotal: number;
  details: {
    areaM2?: number;
    edgeLinearM?: number;
    materialUsed?: string;
    materialPrice?: number;
  };
}

interface CalculationResult {
  components: ComponentBreakdown[];
  totalMaterialCost: number;
  totalEdgeCost: number;
  totalHardwareCost: number;
  totalLaborCost: number;
  subtotal: number;
}

/**
 * Evalúa una fórmula de dimensión reemplazando variables
 * Soporta: ancho, alto, profundidad y operaciones básicas (+, -, *, /)
 */
export function evaluateFormula(
  formula: string,
  ancho: number,
  alto: number,
  profundidad: number
): number {
  if (!formula) return 0;

  // Si es un número puro, devolverlo directamente
  const numValue = parseFloat(formula.trim());
  if (!isNaN(numValue) && formula.trim().match(/^[\d.]+$/)) {
    return numValue;
  }

  // Reemplazar variables con sus valores
  let expression = formula
    .replace(/ancho/gi, String(ancho))
    .replace(/alto/gi, String(alto))
    .replace(/profundidad/gi, String(profundidad));

  // Evaluar expresión matemática segura (solo números y operadores básicos)
  // Sanitizar: solo permitir números, operadores, paréntesis, puntos y espacios
  const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
  
  if (!sanitized.trim()) return 0;

  try {
    // Usar Function constructor para evaluar de forma controlada
    const result = new Function(`return (${sanitized})`)();
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    console.warn(`Error evaluando fórmula: ${formula} → ${sanitized}`);
    return 0;
  }
}

/**
 * Calcula el área de un tablero en m² con factor de desperdicio
 */
export function calculateBoardArea(
  widthMm: number,
  heightMm: number,
  quantity: number,
  wasteFactor: number = 0.12
): number {
  const areaM2 = (widthMm * heightMm) / 1000000 * quantity;
  return areaM2 * (1 + wasteFactor);
}

/**
 * Calcula los metros lineales de canto
 */
export function calculateEdgeLinear(
  dimensionMm: number,
  edgeSides: number,
  quantity: number
): number {
  return (edgeSides * dimensionMm) / 1000 * quantity;
}

/**
 * Busca el material más adecuado por categoría y tipo
 */
function findMaterial(
  materials: MaterialPrice[],
  category: string,
  materialType?: string,
  specificMaterialId?: string
): MaterialPrice | null {
  // Si hay un material específico, buscarlo
  if (specificMaterialId) {
    const found = materials.find(m => m.id === specificMaterialId);
    if (found) return found;
  }

  // Filtrar por categoría
  const byCategory = materials.filter(m => m.category === category);
  if (byCategory.length === 0) return null;

  // Si hay tipo de material, filtrar también
  if (materialType) {
    const byType = byCategory.filter(m => 
      m.materialType?.toLowerCase() === materialType.toLowerCase()
    );
    if (byType.length > 0) return byType[0];
  }

  // Retornar el primero de la categoría
  return byCategory[0];
}

/**
 * Parsea la lista de herrajes desde JSON
 */
function parseHardwareList(
  hardwareListJson?: string
): Array<{ id: string; qty: number }> {
  if (!hardwareListJson) return [];
  try {
    return JSON.parse(hardwareListJson);
  } catch {
    return [];
  }
}

/**
 * Calcula el costo total de un item de cotización basado en componentes
 */
export function calculateQuotationItem(
  components: ComponentInput[],
  materials: MaterialPrice[],
  itemWidth: number,
  itemHeight: number,
  itemDepth: number,
  materialType?: string
): CalculationResult {
  // Buscar tarifa de mano de obra
  const laborRate = findMaterial(materials, 'MANO_OBRA')?.price ?? 18000;

  const breakdowns: ComponentBreakdown[] = [];
  let totalMaterialCost = 0;
  let totalEdgeCost = 0;
  let totalHardwareCost = 0;
  let totalLaborCost = 0;

  for (const comp of components) {
    // Evaluar dimensiones
    const widthMm = evaluateFormula(comp.widthFormula, itemWidth, itemHeight, itemDepth);
    const heightMm = evaluateFormula(comp.heightFormula, itemWidth, itemHeight, itemDepth);
    const depthMm = comp.depthFormula
      ? evaluateFormula(comp.depthFormula, itemWidth, itemHeight, itemDepth)
      : undefined;

    let materialCost = 0;
    let edgeCost = 0;
    let hardwareCost = 0;
    let laborCost = 0;
    const details: ComponentBreakdown['details'] = {};

    // Calcular costo de material
    if (comp.materialCategory === 'TABLERO') {
      // Para tableros: widthFormula = ancho de la pieza, heightFormula = alto/largo de la pieza
      // depthFormula = espesor del tablero (no se usa para área, sino para identificar material)
      const areaM2 = calculateBoardArea(widthMm, heightMm, comp.quantity);
      const material = findMaterial(materials, 'TABLERO', materialType, comp.materialId);
      if (material) {
        materialCost = areaM2 * material.price;
        details.areaM2 = areaM2;
        details.materialUsed = material.name;
        details.materialPrice = material.price;
      }
    } else if (comp.materialCategory === 'HERRAJE') {
      // Para herrajes, el costo viene del hardwareList o del material directo
      const material = findMaterial(materials, 'HERRAJE', undefined, comp.materialId);
      if (material) {
        hardwareCost = comp.quantity * material.price;
        details.materialUsed = material.name;
        details.materialPrice = material.price;
      }
    } else if (comp.materialCategory === 'ACABADO') {
      const areaM2 = calculateBoardArea(widthMm, heightMm, comp.quantity, 0);
      const material = findMaterial(materials, 'ACABADO', materialType, comp.materialId);
      if (material) {
        materialCost = areaM2 * material.price;
        details.areaM2 = areaM2;
        details.materialUsed = material.name;
        details.materialPrice = material.price;
      }
    } else if (comp.materialCategory === 'MANO_OBRA') {
      laborCost = comp.laborHours * comp.quantity * laborRate;
    }

    // Calcular costo de canto
    if (comp.needsEdge && comp.edgeSides > 0) {
      // Canto: se calcula según la cantidad de lados a cantear
      // Para edgeSides=1: un lado largo, 2: dos lados (ancho+alto), 3: tres lados, 4: perímetro completo
      let edgeLinearMm = 0;
      if (comp.edgeSides === 1) {
        edgeLinearMm = Math.max(widthMm, heightMm);
      } else if (comp.edgeSides === 2) {
        edgeLinearMm = widthMm + heightMm;
      } else if (comp.edgeSides === 3) {
        edgeLinearMm = widthMm + heightMm + Math.max(widthMm, heightMm);
      } else if (comp.edgeSides >= 4) {
        edgeLinearMm = 2 * widthMm + 2 * heightMm;
      }
      const edgeLinearM = (edgeLinearMm / 1000) * comp.quantity;
      const edgeMaterial = findMaterial(materials, 'CANTO', comp.edgeType);
      if (edgeMaterial) {
        edgeCost = edgeLinearM * edgeMaterial.price;
        details.edgeLinearM = edgeLinearM;
      }
    }

    // Calcular costo de herrajes desde hardwareList
    const hardwareItems = parseHardwareList(comp.hardwareList);
    for (const hw of hardwareItems) {
      const hwMaterial = materials.find(m => m.id === hw.id);
      if (hwMaterial) {
        hardwareCost += hw.qty * comp.quantity * hwMaterial.price;
      }
    }

    // Calcular mano de obra
    if (comp.laborHours > 0 && comp.materialCategory !== 'MANO_OBRA') {
      laborCost = comp.laborHours * comp.quantity * laborRate;
    }

    const subtotal = materialCost + edgeCost + hardwareCost + laborCost;
    totalMaterialCost += materialCost;
    totalEdgeCost += edgeCost;
    totalHardwareCost += hardwareCost;
    totalLaborCost += laborCost;

    breakdowns.push({
      componentName: comp.name,
      quantity: comp.quantity,
      widthMm,
      heightMm,
      depthMm,
      materialCost,
      edgeCost,
      hardwareCost,
      laborCost,
      subtotal,
      details,
    });
  }

  return {
    components: breakdowns,
    totalMaterialCost,
    totalEdgeCost,
    totalHardwareCost,
    totalLaborCost,
    subtotal: totalMaterialCost + totalEdgeCost + totalHardwareCost + totalLaborCost,
  };
}

/**
 * Generic estimate calculation when no template is available.
 * Uses standard furniture component ratios for Colombian carpentry.
 * This gives a rough estimate based on dimensions + material type.
 */
export function calculateGenericEstimate(
  materials: MaterialPrice[],
  width: number,
  height: number,
  depth: number,
  materialType?: string,
  furnitureType?: string
): CalculationResult {
  const laborRate = findMaterial(materials, 'MANO_OBRA')?.price ?? 18000;
  const w = width / 1000; // Convert to meters
  const h = height / 1000;
  const d = depth / 1000;

  // Standard component ratios for different furniture types
  const componentRatios: Record<string, Array<{ name: string; qty: number; areaRatio: number; needsEdge: boolean; edgeSides: number; laborH: number }>> = {
    COCINA: [
      { name: 'Lateral', qty: 2, areaRatio: 0.85, needsEdge: true, edgeSides: 2, laborH: 0.5 },
      { name: 'Fondo', qty: 1, areaRatio: 0.75, needsEdge: false, edgeSides: 0, laborH: 0.3 },
      { name: 'Base/Piso', qty: 1, areaRatio: 0.8, needsEdge: true, edgeSides: 2, laborH: 0.3 },
      { name: 'Tapa superior', qty: 1, areaRatio: 0.8, needsEdge: true, edgeSides: 2, laborH: 0.2 },
      { name: 'Puerta', qty: 1, areaRatio: 0.9, needsEdge: true, edgeSides: 2, laborH: 1.0 },
      { name: 'Repisa interior', qty: 1, areaRatio: 0.7, needsEdge: true, edgeSides: 1, laborH: 0.2 },
    ],
    CLOSET: [
      { name: 'Lateral', qty: 2, areaRatio: 0.95, needsEdge: true, edgeSides: 2, laborH: 0.5 },
      { name: 'Fondo', qty: 1, areaRatio: 0.85, needsEdge: false, edgeSides: 0, laborH: 0.4 },
      { name: 'Tapa superior', qty: 1, areaRatio: 0.8, needsEdge: true, edgeSides: 2, laborH: 0.2 },
      { name: 'Base', qty: 1, areaRatio: 0.8, needsEdge: true, edgeSides: 2, laborH: 0.2 },
      { name: 'Repisas', qty: 3, areaRatio: 0.7, needsEdge: true, edgeSides: 1, laborH: 0.2 },
      { name: 'Puerta', qty: 2, areaRatio: 0.85, needsEdge: true, edgeSides: 2, laborH: 1.5 },
      { name: 'Entrepaño', qty: 1, areaRatio: 0.7, needsEdge: true, edgeSides: 2, laborH: 0.3 },
    ],
    BANO: [
      { name: 'Lateral', qty: 2, areaRatio: 0.85, needsEdge: true, edgeSides: 2, laborH: 0.5 },
      { name: 'Fondo', qty: 1, areaRatio: 0.8, needsEdge: false, edgeSides: 0, laborH: 0.3 },
      { name: 'Base', qty: 1, areaRatio: 0.75, needsEdge: true, edgeSides: 2, laborH: 0.3 },
      { name: 'Tapa', qty: 1, areaRatio: 0.75, needsEdge: true, edgeSides: 2, laborH: 0.2 },
      { name: 'Puerta', qty: 1, areaRatio: 0.85, needsEdge: true, edgeSides: 2, laborH: 1.0 },
      { name: 'Repisa', qty: 1, areaRatio: 0.6, needsEdge: true, edgeSides: 1, laborH: 0.2 },
    ],
    SALA: [
      { name: 'Lateral', qty: 2, areaRatio: 0.7, needsEdge: true, edgeSides: 2, laborH: 0.5 },
      { name: 'Fondo', qty: 1, areaRatio: 0.8, needsEdge: false, edgeSides: 0, laborH: 0.3 },
      { name: 'Tapa superior', qty: 1, areaRatio: 0.85, needsEdge: true, edgeSides: 2, laborH: 0.2 },
      { name: 'Base', qty: 1, areaRatio: 0.85, needsEdge: true, edgeSides: 2, laborH: 0.3 },
      { name: 'Repisas', qty: 2, areaRatio: 0.75, needsEdge: true, edgeSides: 1, laborH: 0.2 },
      { name: 'Puerta', qty: 2, areaRatio: 0.7, needsEdge: true, edgeSides: 2, laborH: 1.0 },
    ],
    OFICINA: [
      { name: 'Lateral', qty: 2, areaRatio: 0.9, needsEdge: true, edgeSides: 2, laborH: 0.5 },
      { name: 'Fondo', qty: 1, areaRatio: 0.85, needsEdge: false, edgeSides: 0, laborH: 0.3 },
      { name: 'Tapa', qty: 1, areaRatio: 0.85, needsEdge: true, edgeSides: 2, laborH: 0.2 },
      { name: 'Base', qty: 1, areaRatio: 0.8, needsEdge: true, edgeSides: 2, laborH: 0.2 },
      { name: 'Repisas', qty: 4, areaRatio: 0.75, needsEdge: true, edgeSides: 1, laborH: 0.2 },
    ],
  };

  // Default to COCINA components if type not found
  const components = componentRatios[furnitureType || 'COCINA'] || componentRatios.COCINA;

  const breakdowns: ComponentBreakdown[] = [];
  let totalMaterialCost = 0;
  let totalEdgeCost = 0;
  let totalHardwareCost = 0;
  let totalLaborCost = 0;

  // Find board material
  const boardMaterial = findMaterial(materials, 'TABLERO', materialType);
  const edgeMaterial = findMaterial(materials, 'CANTO');

  for (const comp of components) {
    // Estimate component dimensions based on furniture dimensions and ratio
    // Lateral: h × d, Fondo: w × h, Tapa/Base: w × d, Puerta: w × h, Repisa: w × d
    let compWidthMm: number, compHeightMm: number;
    if (comp.name.includes('Lateral') || comp.name.includes('Entrepaño')) {
      compWidthMm = depth || 580;
      compHeightMm = height;
    } else if (comp.name.includes('Fondo')) {
      compWidthMm = width;
      compHeightMm = height;
    } else if (comp.name.includes('Tapa') || comp.name.includes('Base') || comp.name.includes('Repisa')) {
      compWidthMm = width;
      compHeightMm = depth || 580;
    } else if (comp.name.includes('Puerta')) {
      compWidthMm = comp.qty > 1 ? width / 2 - 2 : width; // Split doors
      compHeightMm = height;
    } else {
      compWidthMm = width * 0.8;
      compHeightMm = (depth || 580) * 0.8;
    }

    // Apply area ratio (accounts for smaller actual piece vs furniture dimension)
    const areaM2 = calculateBoardArea(
      compWidthMm * comp.areaRatio,
      compHeightMm * comp.areaRatio,
      comp.qty
    );

    let materialCost = 0;
    let edgeCost = 0;
    let hardwareCost = 0;
    let laborCost = 0;
    const details: ComponentBreakdown['details'] = {};

    // Material cost
    if (boardMaterial) {
      materialCost = areaM2 * boardMaterial.price;
      details.areaM2 = areaM2;
      details.materialUsed = boardMaterial.name;
      details.materialPrice = boardMaterial.price;
    }

    // Edge cost
    if (comp.needsEdge && comp.edgeSides > 0 && edgeMaterial) {
      let edgeLinearMm = 0;
      if (comp.edgeSides === 1) edgeLinearMm = Math.max(compWidthMm, compHeightMm);
      else if (comp.edgeSides === 2) edgeLinearMm = compWidthMm + compHeightMm;
      else edgeLinearMm = 2 * compWidthMm + 2 * compHeightMm;

      const edgeLinearM = (edgeLinearMm / 1000) * comp.qty;
      edgeCost = edgeLinearM * edgeMaterial.price;
      details.edgeLinearM = edgeLinearM;
    }

    // Hardware estimate (basic: hinges + drawer slides if applicable)
    if (comp.name.includes('Puerta')) {
      const hinge = findMaterial(materials, 'HERRAJE', 'bisagra');
      if (hinge) {
        hardwareCost += comp.qty * 2 * hinge.price; // 2 hinges per door
      }
    }

    // Labor
    laborCost = comp.laborH * comp.qty * laborRate;

    const subtotal = materialCost + edgeCost + hardwareCost + laborCost;
    totalMaterialCost += materialCost;
    totalEdgeCost += edgeCost;
    totalHardwareCost += hardwareCost;
    totalLaborCost += laborCost;

    breakdowns.push({
      componentName: comp.name,
      quantity: comp.qty,
      widthMm: Math.round(compWidthMm),
      heightMm: Math.round(compHeightMm),
      materialCost: Math.round(materialCost),
      edgeCost: Math.round(edgeCost),
      hardwareCost: Math.round(hardwareCost),
      laborCost: Math.round(laborCost),
      subtotal: Math.round(subtotal),
      details,
    });
  }

  return {
    components: breakdowns,
    totalMaterialCost: Math.round(totalMaterialCost),
    totalEdgeCost: Math.round(totalEdgeCost),
    totalHardwareCost: Math.round(totalHardwareCost),
    totalLaborCost: Math.round(totalLaborCost),
    subtotal: Math.round(totalMaterialCost + totalEdgeCost + totalHardwareCost + totalLaborCost),
  };
}
