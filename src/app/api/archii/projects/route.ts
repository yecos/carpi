import { NextResponse } from 'next/server';
import { fetchArchiiProjects } from '@/lib/archii-service';

// GET /api/archii/projects - Proxy that fetches projects from Archii
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('X-Archii-Tenant-Id') || searchParams.get('tenantId') || '';
    const apiKey = request.headers.get('X-Archii-Api-Key') || searchParams.get('apiKey') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Se requiere API Key (header X-Archii-Api-Key o query apiKey)' },
        { status: 401 }
      );
    }

    const projects = await fetchArchiiProjects(tenantId, apiKey);

    return NextResponse.json({
      projects: projects.slice(0, limit),
      total: projects.length,
    });
  } catch (error) {
    console.error('Error fetching Archii projects:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener proyectos de Archii' },
      { status: 500 }
    );
  }
}
