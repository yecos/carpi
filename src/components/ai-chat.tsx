'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  Wrench,
  Ruler,
  Paintbrush,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiChatProps {
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { icon: Wrench, label: 'Calcular materiales', prompt: '¿Cómo calculo los materiales necesarios para un módulo de cocina base de 800mm?' },
  { icon: Ruler, label: 'Dimensiones estándar', prompt: '¿Cuáles son las dimensiones estándar para un closet de alcance en carpintería colombiana?' },
  { icon: Paintbrush, label: 'Acabados y precios', prompt: '¿Cuál es la diferencia de precio entre lacado y melamina para un proyecto de cocina?' },
  { icon: Sparkles, label: 'Recomendaciones', prompt: '¿Qué tipo de herrajes recomiendas para cajones de cocina que sean buena relación calidad-precio?' },
];

const SYSTEM_CONTEXT = `Eres el asistente de IA de Carpi, un cotizador de carpintería para proyectos de diseño de interiores en Colombia. 

Tu expertise incluye:
- Cálculo de materiales para muebles (MDF, Melamina, Madera)
- Dimensiones estándar de carpintería colombiana
- Acabados (Lacado, Barniz, Poliuretano, Melamina, Natural)
- Herrajes y accesorios (bisagras, correderas, tiradores)
- Estimación de costos y tiempos
- Recomendaciones de diseño y materiales

Responde de forma clara y práctica. Usa medidas en milímetros. Da recomendaciones específicas para el mercado colombiano cuando sea relevante.`;

export function AiChat({ onClose }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check AI provider on mount
  useEffect(() => {
    fetch('/api/ai/chat')
      .then(res => res.json())
      .then(data => setProvider(data.provider))
      .catch(() => setProvider('none'));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for context
      const chatMessages = [
        { role: 'system' as const, content: SYSTEM_CONTEXT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text.trim() },
      ];

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Error al obtener respuesta');
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update provider info
      if (data.provider) setProvider(data.provider);
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Error de conexión con la IA');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const providerLabels: Record<string, { label: string; color: string }> = {
    'z-ai': { label: 'Z AI', color: 'bg-blue-100 text-blue-700' },
    'gemini': { label: 'Gemini', color: 'bg-purple-100 text-purple-700' },
    'none': { label: 'Sin IA', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Asistente Carpi</h3>
            <p className="text-xs text-muted-foreground">Experto en carpintería y cotizaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {provider && (
            <Badge className={`${providerLabels[provider]?.color || providerLabels.none.color} text-[10px] gap-1`}>
              <Sparkles className="h-3 w-3" />
              {providerLabels[provider]?.label || provider}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <Card className="flex-1 overflow-hidden mb-3">
        <CardContent className="p-4 h-full overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
              <div className="text-center">
                <div className="p-4 rounded-full bg-blue-50 mx-auto w-fit mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                </div>
                <h4 className="font-semibold text-sm mb-1">¡Hola! Soy tu asistente de carpintería</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Pregúntame sobre materiales, dimensiones, acabados, cálculos o cualquier tema de carpintería
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map((qp, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2.5 px-3 text-left justify-start gap-2"
                    onClick={() => sendMessage(qp.prompt)}
                  >
                    <qp.icon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="text-xs">{qp.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-amber-700" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-xs text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre carpintería, materiales, dimensiones..."
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0"
          disabled={loading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
