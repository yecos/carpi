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
