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
 * Formatea una fecha de forma relativa (hace X días)
 */
export function formatDateRelative(date: Date | string | null): string {
  if (!date) return 'Sin actualizar';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace más de 1 año`;
}

/**
 * Verifica si un precio está desactualizado (más de 30 días)
 */
export function isPriceStale(priceUpdatedAt: Date | string | null): boolean {
  if (!priceUpdatedAt) return true;
  const d = typeof priceUpdatedAt === 'string' ? new Date(priceUpdatedAt) : priceUpdatedAt;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 30;
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
  BORRADOR: { label: 'Borrador', color: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200' },
  ENVIADA: { label: 'Enviada', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  APROBADA: { label: 'Aprobada', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  RECHAZADA: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
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
