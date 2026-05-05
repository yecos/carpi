// Unified AI Service for Carpi — TOKEN-OPTIMIZED
// Provider priority: OpenAI → Gemini → Z AI (local only)
// Optimizations: gpt-4.1-mini, short prompts, limited output, image compression

// ============================
// OpenAI Provider (ChatGPT) - PRIMARY for production
// ============================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini';
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

// ============================
// Gemini Provider (public/Vercel) - SECONDARY fallback
// ============================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ============================
// Z AI Provider (local/internal) - TERTIARY fallback
// ============================

const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'http://172.25.136.193:8080/v1';
const ZAI_API_KEY = process.env.ZAI_API_KEY || 'Z.ai';
const ZAI_TOKEN = process.env.ZAI_TOKEN || '';

// ============================
// Types
// ============================

export type AIProvider = 'openai' | 'gemini' | 'z-ai';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
}

export interface AIChatOptions {
  maxTokens?: number;
  temperature?: number;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
}

interface AIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

// ============================
// Image compression utility
// Reduces image size before sending to API = fewer tokens
// ============================

export function compressImageBase64(
  base64DataUrl: string,
  maxSize: number = 768,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // If it's a URL (not base64), return as-is
    if (!base64DataUrl.startsWith('data:')) {
      resolve(base64DataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if larger than maxSize
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64DataUrl); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Compress as JPEG with quality setting
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64DataUrl);
    img.src = base64DataUrl;
  });
}

/**
 * Server-side: strip base64 prefix and reduce if possible
 * For server-side we just extract the data efficiently
 */
export function optimizeImageForAPI(dataUrl: string): { mimeType: string; base64: string } {
  if (!dataUrl.startsWith('data:')) {
    // It's a URL, not base64 - return as-is for OpenAI image_url format
    return { mimeType: 'image/jpeg', base64: dataUrl };
  }

  const matches = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (matches) {
    return { mimeType: matches[1], base64: matches[2] };
  }

  // Fallback: treat as JPEG
  return { mimeType: 'image/jpeg', base64: dataUrl.split(',')[1] || dataUrl };
}

// ============================
// OpenAI API calls — TOKEN OPTIMIZED
// ============================

async function callOpenAIChat(
  messages: AIMessage[],
  options?: AIChatOptions
): Promise<{ content: string; model: string }> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const body = {
    model: OPENAI_CHAT_MODEL,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: options?.maxTokens ?? 300, // Reduced from 2048
    temperature: options?.temperature ?? 0.7,
  };

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error('OpenAI rate limit exceeded');
    if (res.status === 401) throw new Error('OpenAI API key invalid');
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI empty response');

  return { content, model: data.model || OPENAI_CHAT_MODEL };
}

async function callOpenAIVision(
  messages: AIMessage[],
  options?: AIChatOptions
): Promise<{ content: string; model: string }> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  // Convert messages - OpenAI natively supports image_url
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const body = {
    model: OPENAI_VISION_MODEL, // gpt-4.1-mini supports vision!
    messages: formattedMessages,
    max_tokens: options?.maxTokens ?? 300, // Enough for complete compact JSON
    temperature: options?.temperature ?? 0.1, // Low temp for consistent structured output
  };

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error('OpenAI rate limit exceeded');
    if (res.status === 401) throw new Error('OpenAI API key invalid');
    throw new Error(`OpenAI Vision error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI Vision empty response');

  return { content, model: data.model || OPENAI_VISION_MODEL };
}

// ============================
// Gemini API calls
// ============================

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

async function callGeminiChat(
  messages: AIMessage[],
  options?: AIChatOptions
): Promise<{ content: string; model: string }> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

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
      maxOutputTokens: options?.maxTokens ?? 300,
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
  messages: AIMessage[],
  options?: AIChatOptions
): Promise<{ content: string; model: string }> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

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
          const { mimeType, base64 } = optimizeImageForAPI(part.image_url.url);
          parts.push({
            inline_data: { mime_type: mimeType, data: base64 },
          });
        }
      }
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: options?.temperature ?? 0.1,
      maxOutputTokens: options?.maxTokens ?? 150,
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
// Z AI API calls (local only)
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

function resetZAiAvailability() {
  zAiAvailable = null;
}

async function callZAiChat(
  messages: AIMessage[],
  options?: AIChatOptions
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
  messages: AIMessage[],
  options?: AIChatOptions
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
// Unified API - Provider chain: OpenAI → Gemini → Z AI
// ============================

/**
 * Send a chat message to the AI.
 * Priority: OpenAI → Gemini → Z AI
 */
export async function aiChat(
  messages: AIMessage[],
  options?: AIChatOptions
): Promise<AIResponse> {
  const errors: string[] = [];

  // 1. Try OpenAI first (cheapest with gpt-4.1-mini)
  if (OPENAI_API_KEY) {
    try {
      const result = await callOpenAIChat(messages, options);
      return { ...result, provider: 'openai' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('OpenAI chat failed:', msg);
      errors.push(`OpenAI: ${msg}`);
    }
  }

  // 2. Try Gemini
  if (GEMINI_API_KEY) {
    try {
      const result = await callGeminiChat(messages, options);
      return { ...result, provider: 'gemini' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Gemini chat failed:', msg);
      errors.push(`Gemini: ${msg}`);
    }
  }

  // 3. Try Z AI (local only)
  const isAvailable = await checkZAiAvailability();
  if (isAvailable) {
    try {
      const result = await callZAiChat(messages, options);
      return { ...result, provider: 'z-ai' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Z AI chat failed:', msg);
      errors.push(`Z AI: ${msg}`);
      resetZAiAvailability();
    }
  }

  throw new Error(
    `No AI provider available. Configure OPENAI_API_KEY, GEMINI_API_KEY, or run locally with Z AI. Errors: ${errors.join('; ')}`
  );
}

/**
 * Analyze an image with AI (vision).
 * Priority: OpenAI → Gemini → Z AI
 */
export async function aiVision(
  messages: AIMessage[],
  options?: AIChatOptions
): Promise<AIResponse> {
  const errors: string[] = [];

  // 1. Try OpenAI Vision (gpt-4.1-mini with vision)
  if (OPENAI_API_KEY) {
    try {
      const result = await callOpenAIVision(messages, options);
      return { ...result, provider: 'openai' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('OpenAI Vision failed:', msg);
      errors.push(`OpenAI: ${msg}`);
    }
  }

  // 2. Try Gemini Vision
  if (GEMINI_API_KEY) {
    try {
      const result = await callGeminiVision(messages, options);
      return { ...result, provider: 'gemini' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Gemini Vision failed:', msg);
      errors.push(`Gemini: ${msg}`);
    }
  }

  // 3. Try Z AI Vision (local only)
  const isAvailable = await checkZAiAvailability();
  if (isAvailable) {
    try {
      const result = await callZAiVision(messages, options);
      return { ...result, provider: 'z-ai' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Z AI Vision failed:', msg);
      errors.push(`Z AI: ${msg}`);
      resetZAiAvailability();
    }
  }

  throw new Error(
    `No AI vision provider available. Configure OPENAI_API_KEY, GEMINI_API_KEY, or run locally with Z AI. Errors: ${errors.join('; ')}`
  );
}

/**
 * Check which AI provider is currently active.
 */
export async function getActiveProvider(): Promise<AIProvider | 'none'> {
  if (OPENAI_API_KEY) return 'openai';
  if (GEMINI_API_KEY) return 'gemini';
  const isAvailable = await checkZAiAvailability();
  if (isAvailable) return 'z-ai';
  return 'none';
}

/**
 * Get info about all configured providers.
 */
export function getConfiguredProviders(): { provider: AIProvider; configured: boolean; models: string }[] {
  return [
    {
      provider: 'openai',
      configured: !!OPENAI_API_KEY,
      models: `Chat: ${OPENAI_CHAT_MODEL}, Vision: ${OPENAI_VISION_MODEL}`,
    },
    {
      provider: 'gemini',
      configured: !!GEMINI_API_KEY,
      models: GEMINI_MODEL,
    },
    {
      provider: 'z-ai',
      configured: !!ZAI_TOKEN || ZAI_BASE_URL !== 'http://172.25.136.193:8080/v1',
      models: 'glm-4-flash / glm-4v-flash',
    },
  ];
}
