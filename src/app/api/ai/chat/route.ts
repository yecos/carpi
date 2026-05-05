import { NextResponse } from 'next/server';
import { aiChat, getActiveProvider } from '@/lib/ai-service';

// POST /api/ai/chat
// General-purpose AI chat endpoint for Carpi
// Uses Z AI when available (local), falls back to Gemini (Vercel)
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

    if (errorMsg.includes('not configured') || errorMsg.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'Servicio de IA no configurado.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 }
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
    return NextResponse.json({
      provider,
      available: provider !== 'none',
    });
  } catch {
    return NextResponse.json({ provider: 'none', available: false });
  }
}
