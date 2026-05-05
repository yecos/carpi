import { NextResponse } from 'next/server';
import { aiChat, getActiveProvider, getConfiguredProviders } from '@/lib/ai-service';

// POST /api/ai/chat
// General-purpose AI chat endpoint for Carpi
// Uses OpenAI → Gemini → Z AI (in priority order)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, maxTokens, temperature } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un mensaje' },
        { status: 400 }
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: 'Cada mensaje debe tener role y content' },
          { status: 400 }
        );
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return NextResponse.json(
          { error: `Role inválido: ${msg.role}. Debe ser system, user o assistant` },
          { status: 400 }
        );
      }
    }

    const result = await aiChat(messages, {
      maxTokens: maxTokens || 2048,
      temperature: temperature ?? 0.7,
    });

    return NextResponse.json({
      success: true,
      message: result.content,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('AI chat error:', errorMsg);

    if (errorMsg.includes('not configured') || errorMsg.includes('OPENAI_API_KEY') || errorMsg.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'Servicio de IA no configurado. Configure OPENAI_API_KEY o GEMINI_API_KEY.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    if (errorMsg.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Límite de uso alcanzado. Intente en unos segundos.', code: 'AI_RATE_LIMIT' },
        { status: 429 }
      );
    }

    if (errorMsg.includes('API key invalid')) {
      return NextResponse.json(
        { error: 'Clave de API inválida. Verifique la configuración.', code: 'AI_AUTH_ERROR' },
        { status: 401 }
      );
    }

    if (errorMsg.includes('SAFETY_BLOCK')) {
      return NextResponse.json(
        { error: 'Contenido bloqueado por filtros de seguridad.', code: 'AI_SAFETY_BLOCK' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error del servicio de IA. Intente de nuevo.', code: 'AI_ERROR' },
      { status: 502 }
    );
  }
}

// GET /api/ai/chat
// Returns the current AI provider status
export async function GET() {
  try {
    const provider = await getActiveProvider();
    const configured = getConfiguredProviders();
    return NextResponse.json({
      provider,
      available: provider !== 'none',
      providers: configured,
    });
  } catch {
    return NextResponse.json({ provider: 'none', available: false });
  }
}
