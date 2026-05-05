import { NextResponse } from 'next/server';

// POST /api/analyze-furniture
// Analyzes a furniture photo using AI Vision and returns structured data
// Works with both local dev (Z AI internal API) and Vercel (when API is reachable)
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

    // Get API configuration from environment variables
    const zaiBaseUrl = process.env.ZAI_BASE_URL;
    const zaiApiKey = process.env.ZAI_API_KEY;
    const zaiToken = process.env.ZAI_TOKEN;

    if (!zaiBaseUrl || !zaiApiKey) {
      console.error('Z AI Vision API not configured.');
      return NextResponse.json(
        {
          error: 'Servicio de IA no configurado.',
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

    // Build the vision API request body
    const visionRequestBody = {
      model: process.env.ZAI_VISION_MODEL || 'glm-4v-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    };

    // Make direct HTTP request to the Z AI Vision API
    const apiUrl = `${zaiBaseUrl}/chat/completions/vision`;
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${zaiApiKey}`,
      'X-Z-AI-From': 'Z',
    };
    if (zaiToken) {
      reqHeaders['X-Token'] = zaiToken;
    }

    let apiResponse: Response;
    try {
      apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(visionRequestBody),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    } catch (fetchError: unknown) {
      // Handle connection errors (unreachable API, timeout, etc.)
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('Timeout') || errorMsg.includes('abort');
      const isConnectionRefused = errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed') || errorMsg.includes('ENOTFOUND');

      console.error('Vision API connection error:', errorMsg);

      if (isTimeout || isConnectionRefused) {
        return NextResponse.json(
          {
            error: 'El servicio de IA no está disponible en este momento. La función de análisis por foto está disponible solo en modo de desarrollo local.',
            code: 'AI_SERVICE_UNREACHABLE',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Error de conexión con el servicio de IA. Intente de nuevo más tarde.',
          code: 'AI_CONNECTION_ERROR',
        },
        { status: 502 }
      );
    }

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error('Vision API error:', apiResponse.status, errorBody);

      // Check for token-related errors
      if (apiResponse.status === 401 || errorBody.includes('X-Token')) {
        return NextResponse.json(
          {
            error: 'Error de autenticación con el servicio de IA. Verifique la configuración del token.',
            code: 'AI_AUTH_ERROR',
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          error: 'Error del servicio de IA. Intente de nuevo más tarde.',
          code: 'AI_API_ERROR',
        },
        { status: apiResponse.status >= 500 ? 502 : apiResponse.status }
      );
    }

    const response = await apiResponse.json();
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: 'La IA no devolvió una respuesta válida. Intente de nuevo.',
          code: 'AI_EMPTY_RESPONSE',
        },
        { status: 502 }
      );
    }

    // Try to parse the JSON response from the AI
    let parsed;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleaned = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return the raw content with a retry suggestion
      console.error('Failed to parse AI response as JSON:', content);
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
    });
  } catch (error) {
    console.error('Unexpected error analyzing furniture image:', error);
    return NextResponse.json(
      {
        error: 'Error inesperado al analizar la imagen. Intente de nuevo.',
        code: 'UNEXPECTED_ERROR',
      },
      { status: 500 }
    );
  }
}
