/**
 * Formatea un número como moneda colombiana (COP)
 * Ejemplo: 1234567 → "$ 1.234.567"
 */
export function formatCOP(value: number): string {
  return '$ ' + Math.round(value).toLocaleString('es-CO');
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('es-CO');
}

/**
 * Formatea una fecha en formato colombiano
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Categorías de materiales con sus etiquetas en español
 */
export const MATERIAL_CATEGORIES = {
  TABLERO: 'Tablero',
  CANTO: 'Canto',
  HERRAJE: 'Herraje',
  ACABADO: 'Acabado',
  MANO_OBRA: 'Mano de Obra',
  OTRO: 'Otro',
} as const;

/**
 * Tipos de mueble con sus etiquetas en español
 */
export const FURNITURE_TYPES = {
  COCINA: 'Cocina',
  CLOSET: 'Closet',
  BANO: 'Baño',
  SALA: 'Sala',
  OFICINA: 'Oficina',
  COMEDOR: 'Comedor',
  DORMITORIO: 'Dormitorio',
  OTRO: 'Otro',
} as const;

/**
 * Estados de cotización con sus etiquetas y colores
 */
export const QUOTATION_STATUS = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  ENVIADA: { label: 'Enviada', color: 'bg-amber-100 text-amber-700' },
  APROBADA: { label: 'Aprobada', color: 'bg-green-100 text-green-700' },
  RECHAZADA: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
} as const;

/**
 * Unidades de medida con sus etiquetas
 */
export const UNITS = {
  m2: 'm²',
  ml: 'ml',
  unidad: 'Unidad',
  hora: 'Hora',
} as const;
