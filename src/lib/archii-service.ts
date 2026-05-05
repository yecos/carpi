/**
 * Archii Integration Service
 * Handles all communication with the Archii architecture/interior design platform
 */

const ARCHII_API_URL = process.env.ARCHII_API_URL || 'https://archii-theta.vercel.app';

interface ArchiiProject {
  id: string;
  name: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  location?: string;
  status?: string;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ArchiiProjectsResponse {
  projects: ArchiiProject[];
  total: number;
}

interface SyncQuotationPayload {
  quotationId: string;
  archiiTenantId: string;
  archiiProjectId: string;
  clientName: string;
  project: string;
  location?: string;
  subtotal: number;
  margin: number;
  total: number;
  status: string;
  items: Array<{
    name: string;
    width: number;
    height: number;
    depth?: number;
    quantity: number;
    materialType?: string;
    finishType?: string;
    subtotal: number;
  }>;
  currency: string;
}

interface SyncResult {
  success: boolean;
  webhookId?: string;
  error?: string;
}

// In-memory cache for Archii projects (5 minute TTL)
const projectsCache = new Map<string, { data: ArchiiProject[]; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all projects from Archii for a given tenant
 */
export async function fetchArchiiProjects(
  tenantId: string,
  apiKey: string
): Promise<ArchiiProject[]> {
  if (!tenantId || !apiKey) {
    throw new Error('Se requiere tenantId y apiKey para obtener proyectos de Archii');
  }

  // Check cache first
  const cacheKey = `${tenantId}:projects`;
  const cached = projectsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const url = `${ARCHII_API_URL}/api/v1/projects?limit=100`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Error al obtener proyectos de Archii (${response.status}): ${errorText}`);
    }

    const data: ArchiiProjectsResponse = await response.json();
    const projects = data.projects || data as unknown as ArchiiProject[] || [];

    // Update cache
    projectsCache.set(cacheKey, {
      data: projects,
      expires: Date.now() + CACHE_TTL,
    });

    return projects;
  } catch (error) {
    console.error('Error fetching Archii projects:', error);
    throw error;
  }
}

/**
 * Fetch a single project from Archii
 */
export async function fetchArchiiProject(
  tenantId: string,
  projectId: string,
  apiKey: string
): Promise<ArchiiProject | null> {
  if (!tenantId || !projectId || !apiKey) {
    throw new Error('Se requiere tenantId, projectId y apiKey');
  }

  try {
    const url = `${ARCHII_API_URL}/api/v1/projects/${encodeURIComponent(projectId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Error al obtener proyecto de Archii (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Archii project:', error);
    throw error;
  }
}

/**
 * Sync a quotation to Archii via webhook
 */
export async function syncQuotationToArchii(
  payload: SyncQuotationPayload,
  apiKey: string
): Promise<SyncResult> {
  if (!apiKey) {
    throw new Error('Se requiere apiKey para sincronizar con Archii');
  }

  try {
    const url = `${ARCHII_API_URL}/api/v1/webhooks/quotation`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Tenant-Id': payload.archiiTenantId,
      },
      body: JSON.stringify({
        ...payload,
        source: 'carpi',
        syncedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success: false,
        error: `Error al sincronizar con Archii (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      webhookId: data.webhookId || data.id || `sync-${Date.now()}`,
    };
  } catch (error) {
    console.error('Error syncing quotation to Archii:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al sincronizar',
    };
  }
}

/**
 * Test connection to Archii API
 */
export async function testArchiiConnection(
  tenantId: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  if (!apiKey) {
    return { success: false, message: 'Se requiere API Key' };
  }

  try {
    const url = `${ARCHII_API_URL}/api/v1/projects?limit=1`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { success: true, message: 'Conexión exitosa con Archii' };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'API Key inválida o sin permisos' };
    }

    return {
      success: false,
      message: `Error de conexión (${response.status})`,
    };
  } catch (error) {
    return {
      success: false,
      message: `No se pudo conectar a Archii: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
}

/**
 * Clear the projects cache (useful after sync operations)
 */
export function clearArchiiCache(tenantId?: string): void {
  if (tenantId) {
    projectsCache.delete(`${tenantId}:projects`);
  } else {
    projectsCache.clear();
  }
}

/**
 * Handle incoming webhook events from Archii
 */
export interface ArchiiWebhookEvent {
  event: 'project.updated' | 'project.deleted' | 'tenant.config_changed';
  tenantId: string;
  projectId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export function validateWebhookEvent(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  // Simple HMAC validation - in production use proper crypto
  if (!webhookSecret) return true; // Skip validation if no secret configured
  // In a real implementation, use crypto.createHmac to validate
  return signature === webhookSecret;
}
