import { NextResponse } from 'next/server';
import { aiVision } from '@/lib/ai-service';

// POST /api/analyze-furniture
// Analyzes a furniture photo using AI Vision (OpenAI → Gemini → Z AI)
// TOKEN-OPTIMIZED: short prompt, compact JSON, limited output
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Se requiere una imagen' },
        { status: 400 }
      );
    }

    // Short prompt — compact but clear enough for consistent JSON output
    const prompt = `Identifica el mueble de la imagen. Responde SOLO JSON, sin texto antes ni después, sin backticks ni markdown:
{"type":"COCINA|CLOSET|BANO|SALA|OFICINA|COMEDOR|DORMITORIO|OTRO","template":"Módulo Cocina Base|Módulo Cocina Alto|Módulo Closet|Vanidad Baño|Mueble TV|Estantería","name":"nombre descriptivo","w":ancho_mm,"h":alto_mm,"d":prof_mm,"mat":"MDF|Melamina|Madera","fin":"Lacado|Barniz|Poliuretano|Melamina|Natural","conf":"alta|media|baja","parts":[{"n":"componente","q":1,"edge":false}],"obs":"notas"}
Dims estándar Colombia: cocina_b=600x720x580, cocina_a=600x720x350, closet=800x2400x600, baño=900x800x500, tv=1800x500x450, estantería=1200x2000x350. Material: liso→MDF, textura impresa→Melamina, veta natural→Madera.`;

    // Use the unified AI service — 300 tokens is safe for complete JSON
    const result = await aiVision(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      { maxTokens: 300, temperature: 0.1 }
    );

    // Robust JSON parsing
    let parsed;
    try {
      // Step 1: Clean markdown artifacts
      let cleaned = result.content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      // Step 2: Try to find JSON object in the response
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }

      // Step 3: Try to parse
      let raw;
      try {
        raw = JSON.parse(cleaned);
      } catch {
        // Step 4: Try to fix common issues — truncated JSON
        // If JSON is incomplete (missing closing brackets), try to repair
        const openBraces = (cleaned.match(/{/g) || []).length;
        const closeBraces = (cleaned.match(/}/g) || []).length;
        const openBrackets = (cleaned.match(/\[/g) || []).length;
        const closeBrackets = (cleaned.match(/]/g) || []).length;

        let repaired = cleaned;
        // Close unclosed arrays
        for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
        // Close unclosed objects
        for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

        // Try to fix truncated strings (last value without closing quote)
        repaired = repaired.replace(/"obs"\s*:\s*"[^"]*$/, '"obs":""}');
        repaired = repaired.replace(/"name"\s*:\s*"[^"]*$/, '"name":""}');

        raw = JSON.parse(repaired);
      }

      // Map compact format to full format (frontend expects this)
      parsed = {
        furnitureType: raw.type || 'OTRO',
        suggestedTemplate: raw.template || '',
        customName: raw.name || '',
        estimatedWidth: raw.w || 600,
        estimatedHeight: raw.h || 720,
        estimatedDepth: raw.d || 500,
        materialType: raw.mat || 'MDF',
        finishType: raw.fin || 'Lacado',
        confidence: raw.conf || 'media',
        components: (raw.parts || []).map((p: { n: string; q: number; edge: boolean }) => ({
          name: p.n,
          estimatedQuantity: p.q || 1,
          needsEdge: !!p.edge,
        })),
        observations: raw.obs || '',
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', result.content, parseError);
      return NextResponse.json({
        success: false,
        rawResponse: result.content,
        error: 'La IA no devolvió un formato válido. Intente de nuevo.',
        code: 'AI_PARSE_ERROR',
      });
    }

    return NextResponse.json({
      success: true,
      analysis: parsed,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error analyzing furniture image:', errorMsg);

    if (errorMsg.includes('not configured')) {
      return NextResponse.json(
        { error: 'Servicio de IA no configurado. Configure OPENAI_API_KEY, GEMINI_API_KEY o Z AI.', code: 'AI_NOT_CONFIGURED' },
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
        { error: 'La imagen fue bloqueada por filtros de seguridad. Intente con otra foto.', code: 'AI_SAFETY_BLOCK' },
        { status: 400 }
      );
    }

    if (errorMsg.includes('unavailable')) {
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible. Intente más tarde.', code: 'AI_QUOTA_EXCEEDED' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Error al analizar la imagen. Intente de nuevo.', code: 'AI_ERROR' },
      { status: 500 }
    );
  }
}
