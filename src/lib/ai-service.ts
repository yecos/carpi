// Unified AI Service for Carpi
// Tries Z AI (internal) first, falls back to Gemini (public) if unavailable
// This allows the app to work in both local dev and Vercel

// ============================
// Z AI Provider (local/internal)
// ============================

const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'http://172.25.136.193:8080/v1';
const ZAI_API_KEY = process.env.ZAI_API_KEY || 'Z.ai';
const ZAI_TOKEN = process.env.ZAI_TOKEN || '';

// ============================
// Gemini Provider (public/Vercel)
// ============================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ============================
// Provider detection
// ============================

let zAiAvailable: boolean | null = null;

async function checkZAiAvailability(): Promise<boolean> {
  if (zAiAvailable !== null) return zAiAvailable;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZAI_API_KEY}`,
      'X-Z-AI-From': 'Z',
    };
    if (ZAI_TOKEN) headers['X-Token'] = ZAI_TOKEN;

    const res = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(5000),
    });

    zAiAvailable = res.ok;
    return zAiAvailable;
  } catch {
    zAiAvailable = false;
    return false;
  }
}

// Reset availability check (e.g., after a failure)
function resetZAiAvailability() {
  zAiAvailable = null;
}

// ============================
// Z AI API calls
// ============================

interface ZAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ZAiContentPart[];
}

interface ZAiContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

async function callZAiChat(
  messages: ZAiMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; model: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZAI_API_KEY}`,
    'X-Z-AI-From': 'Z',
  };
  if (ZAI_TOKEN) headers['X-Token'] = ZAI_TOKEN;

  const body: Record<string, unknown> = {
    messages,
    thinking: { type: 'disabled' },
  };
  if (options?.maxTokens) body.max_tokens = options.maxTokens;
  if (options?.temperature !== undefined) body.temperature = options.temperature;

  const res = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Z AI error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Z AI empty response');

  return { content, model: data.model || 'z-ai' };
}

async function callZAiVision(
  messages: ZAiMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; model: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZAI_API_KEY}`,
    'X-Z-AI-From': 'Z',
  };
  if (ZAI_TOKEN) headers['X-Token'] = ZAI_TOKEN;

  const body: Record<string, unknown> = {
    model: process.env.ZAI_VISION_MODEL || 'glm-4v-flash',
    messages,
    thinking: { type: 'disabled' },
  };
  if (options?.maxTokens) body.max_tokens = options.maxTokens;
  if (options?.temperature !== undefined) body.temperature = options.temperature;

  const res = await fetch(`${ZAI_BASE_URL}/chat/completions/vision`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Z AI Vision error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Z AI Vision empty response');

  return { content, model: data.model || 'z-ai-vision' };
}

// ============================
// Gemini API calls
// ============================

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

async function callGeminiChat(
  messages: ZAiMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; model: string }> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  // Convert OpenAI-style messages to Gemini format
  const parts: GeminiPart[] = [];
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text' && part.text) {
          parts.push({ text: part.text });
        }
      }
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2048,
    },
  };

  const models = [GEMINI_MODEL, 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      if (res.status === 429 || res.status === 404) continue; // Try next model
      const errText = await res.text();
      throw new Error(`Gemini error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('AI_SAFETY_BLOCK');
      }
      continue;
    }

    return { content, model };
  }

  throw new Error('All Gemini models unavailable');
}

async function callGeminiVision(
  messages: ZAiMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; model: string }> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  // Convert messages to Gemini format with image support
  const parts: GeminiPart[] = [];
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text' && part.text) {
          parts.push({ text: part.text });
        }
        if (part.type === 'image_url' && part.image_url?.url) {
          const url = part.image_url.url;
          let mimeType = 'image/jpeg';
          let base64Data = url;

          if (url.startsWith('data:')) {
            const matches = url.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
            if (matches) {
              mimeType = matches[1];
              base64Data = matches[2];
            }
          }

          parts.push({
            inline_data: { mime_type: mimeType, data: base64Data },
          });
        }
      }
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxTokens ?? 2048,
    },
  };

  const models = [GEMINI_MODEL, 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      if (res.status === 429 || res.status === 404) continue;
      const errText = await res.text();
      throw new Error(`Gemini Vision error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('AI_SAFETY_BLOCK');
      }
      continue;
    }

    return { content, model };
  }

  throw new Error('All Gemini models unavailable');
}

// ============================
// Unified API
// ============================

export type AIProvider = 'z-ai' | 'gemini';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
}

export interface AIChatOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Send a chat message to the AI.
 * Tries Z AI first, falls back to Gemini.
 */
export async function aiChat(
  messages: ZAiMessage[],
  options?: AIChatOptions
): Promise<AIResponse> {
  // Try Z AI first
  const isAvailable = await checkZAiAvailability();
  if (isAvailable) {
    try {
      const result = await callZAiChat(messages, options);
      return { ...result, provider: 'z-ai' };
    } catch (error) {
      console.error('Z AI chat failed, falling back to Gemini:', error);
      resetZAiAvailability();
    }
  }

  // Fallback to Gemini
  const result = await callGeminiChat(messages, options);
  return { ...result, provider: 'gemini' };
}

/**
 * Analyze an image with AI (vision).
 * Tries Z AI Vision first, falls back to Gemini.
 */
export async function aiVision(
  messages: ZAiMessage[],
  options?: AIChatOptions
): Promise<AIResponse> {
  // Try Z AI Vision first
  const isAvailable = await checkZAiAvailability();
  if (isAvailable) {
    try {
      const result = await callZAiVision(messages, options);
      return { ...result, provider: 'z-ai' };
    } catch (error) {
      console.error('Z AI Vision failed, falling back to Gemini:', error);
      resetZAiAvailability();
    }
  }

  // Fallback to Gemini
  const result = await callGeminiVision(messages, options);
  return { ...result, provider: 'gemini' };
}

/**
 * Check which AI provider is currently active.
 */
export async function getActiveProvider(): Promise<AIProvider | 'none'> {
  const isAvailable = await checkZAiAvailability();
  if (isAvailable) return 'z-ai';
  if (GEMINI_API_KEY) return 'gemini';
  return 'none';
}
