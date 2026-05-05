import { NextResponse } from 'next/server';

// Models to try in order (fallback chain)
const MODEL_FALLBACKS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

// POST /api/analyze-furniture
// Analyzes a furniture photo using Google Gemini Vision API
// Works on both local dev and Vercel (public API endpoint)
// Falls back to alternative models if the primary one is rate-limited
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

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.error('Gemini API key not configured. Set GEMINI_API_KEY env var.');
      return NextResponse.json(
        {
          error: 'Servicio de IA no configurado. Configure la variable de entorno GEMINI_API_KEY.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const prompt = `Eres un experto en carpintería y diseño de interiores en Colombia. Analiza esta foto de un mueble y proporciona la siguiente información en formato JSON exacto.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks:

{
  "furnitureType": "COCINA | CLOSET | BANO | SALA | OFICINA | COMEDOR | DORMITORIO | OTRO",
  "suggestedTemplate": "nombre del tipo de mueble estándar que más se parece (Módulo Cocina Base, Módulo Cocina Alto, Módulo Closet, Vanidad Baño, Mueble TV, Estantería, u otro)",
  "customName": "nombre descriptivo del mueble visto en la foto",
  "estimatedWidth": número en milímetros (estimación del ancho),
  "estimatedHeight": número en milímetros (estimación del alto),
  "estimatedDepth": número en milímetros (estimación de la profundidad),
  "materialType": "MDF | Melamina | Madera",
  "finishType": "Lacado | Barniz | Poliuretano | Melamina | Natural",
  "confidence": "alta | media | baja",
  "components": [
    {
      "name": "nombre del componente (ej: Puerta, Lateral, Repisa, Fondo, Tapa)",
      "estimatedQuantity": número,
      "needsEdge": true/false
    }
  ],
  "observations": "observaciones adicionales sobre el mueble, acabado, detalles visibles, herrajes que se puedan identificar"
}

REGLAS IMPORTANTES:
- Si es un mueble de cocina bajo (debajo de la encimera), usa furnitureType "COCINA" y suggestedTemplate "Módulo Cocina Base"
- Si es un mueble de cocina alto (alacena), usa furnitureType "COCINA" y suggestedTemplate "Módulo Cocina Alto"
- Si es un closet o vestier, usa "CLOSET" y "Módulo Closet"
- Si es una vanidad o mueble de baño, usa "BANO" y "Vanidad Baño"
- Si es un mueble de TV o centro de entretenimiento, usa "SALA" y "Mueble TV"
- Si es una estantería o librería, usa "OFICINA" y "Estantería"
- Para dimensiones, usa referencias estándar de carpintería colombiana si no hay referencia de escala clara:
  * Cocina base: 600mm ancho × 720mm alto × 580mm profundidad
  * Cocina alto: 600mm ancho × 720mm alto × 350mm profundidad
  * Closet: 800mm ancho × 2400mm alto × 600mm profundidad
  * Vanidad baño: 900mm ancho × 800mm alto × 500mm profundidad
  * Mueble TV: 1800mm ancho × 500mm alto × 450mm profundidad
  * Estantería: 1200mm ancho × 2000mm alto × 350mm profundidad
- Identifica el material: MDF (si parece tablero liso, generalmente lacado), Melamina (si tiene textura de madera impresa), Madera natural (si tiene veta natural visible)
- Identifica herrajes visibles: bisagras, tiradores, correderas
- El campo confidence indica qué tan seguro estás de las estimaciones`;

    // Parse the base64 image data to extract mime type and raw base64
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const matches = image.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    // Gemini API request body
    const geminiRequestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    };

    // Determine model priority: env var override or fallback chain
    const preferredModel = process.env.GEMINI_MODEL;
    const modelsToTry = preferredModel
      ? [preferredModel, ...MODEL_FALLBACKS.filter(m => m !== preferredModel)]
      : MODEL_FALLBACKS;

    let lastError: { status: number; body: string } | null = null;

    // Try each model in the fallback chain
    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      let apiResponse: Response;
      try {
        apiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiRequestBody),
          signal: AbortSignal.timeout(60000),
        });
      } catch (fetchError: unknown) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('Timeout') || errorMsg.includes('abort');
        const isConnectionRefused = errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed') || errorMsg.includes('ENOTFOUND');

        console.error(`Gemini API connection error (model: ${model}):`, errorMsg);

        if (isTimeout) {
          return NextResponse.json(
            { error: 'El análisis está demorando demasiado. Intente de nuevo.', code: 'AI_TIMEOUT' },
            { status: 504 }
          );
        }

        if (isConnectionRefused) {
          return NextResponse.json(
            { error: 'No se pudo conectar con Google Gemini. Verifique su conexión a internet.', code: 'AI_SERVICE_UNREACHABLE' },
            { status: 503 }
          );
        }

        return NextResponse.json(
          { error: 'Error de conexión con el servicio de IA.', code: 'AI_CONNECTION_ERROR' },
          { status: 502 }
        );
      }

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error(`Gemini API error (model: ${model}):`, apiResponse.status, errorBody);
        lastError = { status: apiResponse.status, body: errorBody };

        // If rate limited (429), try next model in fallback chain
        if (apiResponse.status === 429) {
          console.log(`Model ${model} rate limited, trying next fallback...`);
          continue;
        }

        // If model not found (404), try next model
        if (apiResponse.status === 404) {
          console.log(`Model ${model} not found, trying next fallback...`);
          continue;
        }

        // For other errors, return immediately
        if (apiResponse.status === 400) {
          return NextResponse.json(
            { error: 'La imagen no es válida o el formato no es compatible. Intente con otra imagen.', code: 'AI_INVALID_IMAGE' },
            { status: 400 }
          );
        }

        if (apiResponse.status === 403) {
          return NextResponse.json(
            { error: 'La API key de Gemini no es válida o ha expirado. Configure una clave válida.', code: 'AI_AUTH_ERROR' },
            { status: 502 }
          );
        }

        return NextResponse.json(
          { error: 'Error del servicio de IA. Intente de nuevo más tarde.', code: 'AI_API_ERROR' },
          { status: apiResponse.status >= 500 ? 502 : apiResponse.status }
        );
      }

      // Success! Parse the response
      const response = await apiResponse.json();
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          return NextResponse.json(
            { error: 'La imagen fue bloqueada por los filtros de seguridad. Intente con otra imagen.', code: 'AI_SAFETY_BLOCK' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'La IA no devolvió una respuesta válida. Intente de nuevo.', code: 'AI_EMPTY_RESPONSE' },
          { status: 502 }
        );
      }

      // Try to parse the JSON response
      let parsed;
      try {
        const cleaned = content
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        console.error('Failed to parse Gemini response as JSON:', content);
        return NextResponse.json({
          success: false,
          rawResponse: content,
          error: 'La IA no devolvió un formato válido. Intente de nuevo.',
          code: 'AI_PARSE_ERROR',
        });
      }

      return NextResponse.json({
        success: true,
        analysis: parsed,
        model, // Include which model was used for debugging
      });
    }

    // All models failed with 429 or 404
    if (lastError?.status === 429) {
      return NextResponse.json(
        { error: 'Se ha excedido la cuota de uso de la IA. Espere unos minutos e intente de nuevo.', code: 'AI_QUOTA_EXCEEDED' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'No se encontró un modelo de IA disponible. Intente de nuevo más tarde.', code: 'AI_NO_MODEL_AVAILABLE' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Unexpected error analyzing furniture image:', error);
    return NextResponse.json(
      { error: 'Error inesperado al analizar la imagen. Intente de nuevo.', code: 'UNEXPECTED_ERROR' },
      { status: 500 }
    );
  }
}
