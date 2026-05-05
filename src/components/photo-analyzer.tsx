'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AnalysisResult {
  furnitureType: string;
  suggestedTemplate: string;
  customName: string;
  estimatedWidth: number;
  estimatedHeight: number;
  estimatedDepth: number;
  materialType: string;
  finishType: string;
  confidence: string;
  components: Array<{
    name: string;
    estimatedQuantity: number;
    needsEdge: boolean;
  }>;
  observations: string;
}

interface PhotoAnalyzerProps {
  templates: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  onAnalysisComplete: (result: {
    templateId: string | null;
    templateName: string;
    customName: string;
    width: number;
    height: number;
    depth: number;
    materialType: string;
    finishType: string;
  }) => void;
  onCancel: () => void;
}

export function PhotoAnalyzer({ templates, onAnalysisComplete, onCancel }: PhotoAnalyzerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccione un archivo de imagen válido');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function analyzeImage() {
    if (!imageBase64) return;

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await res.json();

      if (!data.success) {
        // Map error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          'AI_NOT_CONFIGURED': 'El servicio de IA no está configurado. Configure OPENAI_API_KEY o GEMINI_API_KEY.',
          'AI_SERVICE_UNREACHABLE': 'No se pudo conectar con el servicio de IA. Verifique su conexión a internet.',
          'AI_CONNECTION_ERROR': 'No se pudo conectar con el servicio de IA. Verifique su conexión a internet.',
          'AI_AUTH_ERROR': 'La API Key no es válida o ha expirado. Configure una clave válida.',
          'AI_API_ERROR': 'El servicio de IA respondió con un error. Intente de nuevo más tarde.',
          'AI_EMPTY_RESPONSE': 'La IA no pudo analizar esta imagen. Intente con otra foto.',
          'AI_PARSE_ERROR': 'La IA devolvió un formato inesperado. Intente de nuevo.',
          'AI_TIMEOUT': 'El análisis está demorando demasiado. Intente de nuevo.',
          'AI_QUOTA_EXCEEDED': 'Se ha excedido la cuota de uso de la IA. Espere unos minutos e intente de nuevo.',
          'AI_RATE_LIMIT': 'Límite de uso alcanzado. Intente en unos segundos.',
          'AI_INVALID_IMAGE': 'La imagen no es válida o el formato no es compatible. Intente con otra imagen.',
          'AI_SAFETY_BLOCK': 'La imagen fue bloqueada por los filtros de seguridad. Intente con otra foto.',
        };
        const errorMsg = errorMessages[data.code] || data.error || data.rawResponse || 'Error al analizar la imagen';
        setError(errorMsg);
        toast.error(data.error || 'Error al analizar la imagen');
        return;
      }

      setResult(data.analysis);
      toast.success('Análisis completado');
    } catch (err) {
      console.error('Error analyzing:', err);
      setError('Error de conexión al analizar la imagen');
      toast.error('Error al conectar con el servicio de IA');
    } finally {
      setAnalyzing(false);
    }
  }

  function applyAnalysis() {
    if (!result) return;

    // Find matching template
    const matchingTemplate = templates.find(
      (t) =>
        t.name.toLowerCase().includes(result.suggestedTemplate?.toLowerCase()) ||
        result.suggestedTemplate?.toLowerCase().includes(t.name.toLowerCase())
    );

    onAnalysisComplete({
      templateId: matchingTemplate?.id || null,
      templateName: matchingTemplate?.name || result.suggestedTemplate || result.customName,
      customName: result.customName || '',
      width: result.estimatedWidth || 600,
      height: result.estimatedHeight || 720,
      depth: result.estimatedDepth || 500,
      materialType: result.materialType || 'MDF',
      finishType: result.finishType || 'Lacado',
    });

    toast.success('Datos aplicados al item');
  }

  const confidenceConfig = {
    alta: { label: 'Alta', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    media: { label: 'Media', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    baja: { label: 'Baja', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  };

  const furnitureTypeLabels: Record<string, string> = {
    COCINA: 'Cocina',
    CLOSET: 'Closet',
    BANO: 'Baño',
    SALA: 'Sala',
    OFICINA: 'Oficina',
    COMEDOR: 'Comedor',
    DORMITORIO: 'Dormitorio',
    OTRO: 'Otro',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Cotizar desde Foto</h3>
            <p className="text-xs text-muted-foreground">La IA analiza el mueble y estima materiales</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> Cerrar
        </Button>
      </div>

      {/* Image Upload Area */}
      {!imagePreview ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-purple-50">
                <Camera className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-center">
                <p className="font-medium">Sube una foto del mueble</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos: JPG, PNG, WebP • Máximo 10MB
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Subir imagen
                </Button>
              </div>
              <p className="text-xs text-muted-foreground max-w-md text-center">
                Tip: Para mejores resultados, incluye un objeto de referencia (hoja A4, teléfono) o toma la foto de frente mostrando todo el mueble.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Image Preview */}
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Mueble a analizar"
                  className="w-full max-h-64 object-contain rounded-lg bg-muted/30"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={clearImage}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analyze Button */}
          {!result && !error && (
            <Button
              onClick={analyzeImage}
              className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analizar Mueble con IA
                </>
              )}
            </Button>
          )}

          {/* Analyzing state */}
          {analyzing && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="py-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                    <Sparkles className="h-5 w-5 text-purple-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-purple-900">Analizando mueble...</p>
                    <p className="text-sm text-purple-700 mt-1">
                      Identificando tipo, dimensiones y materiales
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {error && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 text-sm">Error en el análisis</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={analyzeImage}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Confidence Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const conf = confidenceConfig[result.confidence as keyof typeof confidenceConfig] || confidenceConfig.media;
                    const ConfIcon = conf.icon;
                    return (
                      <Badge className={`${conf.color} gap-1`}>
                        <ConfIcon className="h-3 w-3" />
                        Confianza: {conf.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>

              {/* Main Result Card */}
              <Card className="border-purple-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Resultado del Análisis</span>
                  </div>

                  {/* Furniture Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-muted-foreground text-xs">Tipo de Mueble</p>
                      <p className="font-medium">
                        {furnitureTypeLabels[result.furnitureType] || result.furnitureType}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-muted-foreground text-xs">Plantilla Sugerida</p>
                      <p className="font-medium">{result.suggestedTemplate}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-muted-foreground text-xs">Material</p>
                      <Badge variant="secondary">{result.materialType}</Badge>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-muted-foreground text-xs">Acabado</p>
                      <Badge variant="secondary">{result.finishType}</Badge>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-800 mb-2">Dimensiones Estimadas</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-amber-900">{result.estimatedWidth}</p>
                        <p className="text-xs text-amber-700">Ancho (mm)</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-900">{result.estimatedHeight}</p>
                        <p className="text-xs text-amber-700">Alto (mm)</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-900">{result.estimatedDepth}</p>
                        <p className="text-xs text-amber-700">Prof. (mm)</p>
                      </div>
                    </div>
                  </div>

                  {/* Components Detected */}
                  {result.components && result.components.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Componentes Detectados
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.components.map((comp, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs gap-1"
                          >
                            {comp.name}
                            <span className="text-muted-foreground">×{comp.estimatedQuantity}</span>
                            {comp.needsEdge && (
                              <span className="text-amber-600">+canto</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observations */}
                  {result.observations && (
                    <div className="bg-muted/30 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Observaciones</p>
                      <p className="text-xs text-foreground">{result.observations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Otra foto
                </Button>
                <Button
                  onClick={applyAnalysis}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 gap-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aplicar al Item
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Revisa y ajusta las dimensiones y materiales antes de calcular
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
