'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calculator,
  Package,
  Eye,
  Camera,
  Sparkles,
} from 'lucide-react';
import { formatCOP, FURNITURE_TYPES, MATERIAL_CATEGORIES } from '@/lib/format';
import { PhotoAnalyzer } from './photo-analyzer';

interface FurnitureTemplate {
  id: string;
  name: string;
  type: string;
  description: string | null;
  components: Array<{
    id: string;
    name: string;
    quantity: number;
    widthFormula: string;
    heightFormula: string;
    depthFormula?: string | null;
    materialCategory: string;
    needsEdge: boolean;
    edgeSides: number;
    laborHours: number;
  }>;
}

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  materialType: string | null;
}

interface CalculationBreakdown {
  componentName: string;
  quantity: number;
  widthMm: number;
  heightMm: number;
  materialCost: number;
  edgeCost: number;
  hardwareCost: number;
  laborCost: number;
  subtotal: number;
  details: {
    areaM2?: number;
    edgeLinearM?: number;
    materialUsed?: string;
  };
}

interface QuotationItemDraft {
  templateId: string;
  templateName: string;
  customName: string;
  width: number;
  height: number;
  depth: number;
  quantity: number;
  materialType: string;
  finishType: string;
  subtotal: number;
  breakdown: CalculationBreakdown[] | null;
  totalSubtotal: number;
}

interface QuotationBuilderProps {
  onSave: (data: {
    clientName: string;
    project: string;
    location: string;
    notes: string;
    margin: number;
    items: Array<{
      templateId: string | null;
      customName: string | null;
      width: number;
      height: number;
      depth: number | null;
      quantity: number;
      materialType: string | null;
      finishType: string | null;
      subtotal: number;
      detail: CalculationBreakdown[] | null;
    }>;
  }) => void;
  onCancel: () => void;
}

const MATERIAL_TYPES = ['MDF', 'Melamina', 'Madera'];
const FINISH_TYPES = ['Lacado', 'Barniz', 'Poliuretano', 'Melamina', 'Natural'];

export function QuotationBuilder({ onSave, onCancel }: QuotationBuilderProps) {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [project, setProject] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [margin, setMargin] = useState(25);
  const [items, setItems] = useState<QuotationItemDraft[]>([]);
  const [templates, setTemplates] = useState<FurnitureTemplate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [calculating, setCalculating] = useState<string | null>(null);
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadMaterials();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch('/api/furniture');
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  async function loadMaterials() {
    try {
      const res = await fetch('/api/materials');
      const data = await res.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  }

  async function calculateItem(index: number) {
    const item = items[index];
    if (!item.templateId || !item.width || !item.height) return;

    setCalculating(item.templateId + index);

    try {
      const res = await fetch('/api/quotations/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: item.templateId,
          width: item.width,
          height: item.height,
          depth: item.depth || 0,
          materialType: item.materialType || undefined,
          finishType: item.finishType || undefined,
        }),
      });

      const data = await res.json();

      const updatedItems = [...items];
      updatedItems[index] = {
        ...item,
        subtotal: data.subtotal,
        breakdown: data.components,
        totalSubtotal: data.subtotal * item.quantity,
      };
      setItems(updatedItems);
      toast.success('Cálculo realizado');
    } catch (error) {
      console.error('Error calculating:', error);
      toast.error('Error al calcular');
    } finally {
      setCalculating(null);
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        templateId: '',
        templateName: '',
        customName: '',
        width: 0,
        height: 0,
        depth: 0,
        quantity: 1,
        materialType: '',
        finishType: '',
        subtotal: 0,
        breakdown: null,
        totalSubtotal: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof QuotationItemDraft, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill dimensions when template is selected
    if (field === 'templateId' && value) {
      const template = templates.find((t) => t.id === value);
      if (template) {
        updated[index].templateName = template.name;
        // Set default dimensions based on template type
        const defaults: Record<string, { w: number; h: number; d: number }> = {
          'Módulo Cocina Base': { w: 600, h: 720, d: 580 },
          'Módulo Cocina Alto': { w: 600, h: 720, d: 350 },
          'Módulo Closet': { w: 800, h: 2400, d: 600 },
          'Vanidad Baño': { w: 900, h: 800, d: 500 },
          'Mueble TV': { w: 1800, h: 500, d: 450 },
          'Estantería': { w: 1200, h: 2000, d: 350 },
        };
        const defaultDim = defaults[template.name];
        if (defaultDim) {
          updated[index].width = defaultDim.w;
          updated[index].height = defaultDim.h;
          updated[index].depth = defaultDim.d;
        }
      }
    }

    // Reset breakdown when dimensions change
    if (['width', 'height', 'depth', 'materialType', 'finishType'].includes(field)) {
      updated[index].breakdown = null;
      updated[index].subtotal = 0;
      updated[index].totalSubtotal = 0;
    }

    setItems(updated);
  }

  const subtotal = items.reduce((sum, item) => sum + item.totalSubtotal, 0);
  const total = subtotal * (1 + margin / 100);

  function handleSave() {
    if (!clientName || !project) {
      toast.error('Complete la información del cliente');
      setStep(1);
      return;
    }

    if (items.length === 0 || items.every((i) => i.subtotal === 0)) {
      toast.error('Agregue al menos un item con cálculo');
      setStep(2);
      return;
    }

    onSave({
      clientName,
      project,
      location,
      notes,
      margin,
      items: items.map((item) => ({
        templateId: item.templateId || null,
        customName: item.customName || item.templateName || null,
        width: item.width,
        height: item.height,
        depth: item.depth || null,
        quantity: item.quantity,
        materialType: item.materialType || null,
        finishType: item.finishType || null,
        subtotal: item.subtotal,
        detail: item.breakdown,
      })),
    });
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: 'Cliente' },
          { num: 2, label: 'Items' },
          { num: 3, label: 'Revisión' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                step >= s.num
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white text-xs">
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Client Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nombre del Cliente *</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="grid gap-2">
                <Label>Proyecto *</Label>
                <Input
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Nombre del proyecto"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ubicación</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ciudad, dirección"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Items */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Items de la Cotización</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPhotoAnalyzer(true)}
                size="sm"
                variant="outline"
                className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Cotizar</span> desde Foto
                <Sparkles className="h-3 w-3" />
              </Button>
              <Button onClick={addItem} size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-1" /> Agregar Item
              </Button>
            </div>
          </div>

          {/* Photo Analyzer */}
          {showPhotoAnalyzer && (
            <Card className="border-purple-200 bg-purple-50/30">
              <CardContent className="p-4">
                <PhotoAnalyzer
                  templates={templates}
                  onAnalysisComplete={(analysisResult) => {
                    // Add a new item with the analysis results
                    const newItem: QuotationItemDraft = {
                      templateId: analysisResult.templateId || '',
                      templateName: analysisResult.templateName,
                      customName: analysisResult.customName,
                      width: analysisResult.width,
                      height: analysisResult.height,
                      depth: analysisResult.depth,
                      quantity: 1,
                      materialType: analysisResult.materialType,
                      finishType: analysisResult.finishType,
                      subtotal: 0,
                      breakdown: null,
                      totalSubtotal: 0,
                    };
                    setItems([...items, newItem]);
                    setShowPhotoAnalyzer(false);
                    toast.success('Item agregado desde análisis de foto. Presiona Calcular para ver el costo.');
                  }}
                  onCancel={() => setShowPhotoAnalyzer(false)}
                />
              </CardContent>
            </Card>
          )}

          {items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Agregue items a la cotización</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar primer item
                </Button>
              </CardContent>
            </Card>
          ) : (
            items.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Item {index + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeItem(index)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 grid gap-2">
                      <Label className="text-xs">Plantilla del Catálogo</Label>
                      <Select value={item.templateId} onValueChange={(v) => updateItem(index, 'templateId', v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar plantilla..." /></SelectTrigger>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} ({FURNITURE_TYPES[t.type as keyof typeof FURNITURE_TYPES]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Ancho (mm)</Label>
                      <Input
                        type="number"
                        value={item.width || ''}
                        onChange={(e) => updateItem(index, 'width', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Alto (mm)</Label>
                      <Input
                        type="number"
                        value={item.height || ''}
                        onChange={(e) => updateItem(index, 'height', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Profundidad (mm)</Label>
                      <Input
                        type="number"
                        value={item.depth || ''}
                        onChange={(e) => updateItem(index, 'depth', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Tipo Material</Label>
                      <Select value={item.materialType} onValueChange={(v) => updateItem(index, 'materialType', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                        <SelectContent>
                          {MATERIAL_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Acabado</Label>
                      <Select value={item.finishType} onValueChange={(v) => updateItem(index, 'finishType', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Acabado..." /></SelectTrigger>
                        <SelectContent>
                          {FINISH_TYPES.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Nombre personalizado</Label>
                      <Input
                        value={item.customName}
                        onChange={(e) => updateItem(index, 'customName', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => calculateItem(index)}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        disabled={!item.templateId || !item.width || !item.height || !!calculating}
                      >
                        {calculating === item.templateId + index ? (
                          <span className="animate-pulse">Calculando...</span>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4 mr-1" />
                            Calcular
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Breakdown */}
                  {item.breakdown && (
                    <div className="mt-3 border rounded-lg overflow-hidden">
                      <div className="bg-amber-50 px-3 py-2">
                        <span className="text-sm font-medium text-amber-800">
                          Desglose - {item.templateName}
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-2">Componente</th>
                              <th className="text-right p-2">Material</th>
                              <th className="text-right p-2">Canto</th>
                              <th className="text-right p-2">Herraje</th>
                              <th className="text-right p-2">MO</th>
                              <th className="text-right p-2 font-semibold">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.breakdown.map((b, bi) => (
                              <tr key={bi} className="border-b last:border-0">
                                <td className="p-2">
                                  {b.name}
                                  <span className="text-muted-foreground ml-1">x{b.quantity}</span>
                                </td>
                                <td className="text-right p-2">{formatCOP(b.materialCost)}</td>
                                <td className="text-right p-2">{formatCOP(b.edgeCost)}</td>
                                <td className="text-right p-2">{formatCOP(b.hardwareCost)}</td>
                                <td className="text-right p-2">{formatCOP(b.laborCost)}</td>
                                <td className="text-right p-2 font-medium">{formatCOP(b.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-amber-50 px-3 py-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-amber-800">
                          Subtotal unitario
                        </span>
                        <span className="font-bold text-amber-900">{formatCOP(item.subtotal)}</span>
                      </div>
                      {item.quantity > 1 && (
                        <div className="bg-amber-100 px-3 py-2 flex justify-between items-center">
                          <span className="text-sm font-medium text-amber-900">
                            Subtotal x{item.quantity}
                          </span>
                          <span className="font-bold text-amber-900">{formatCOP(item.totalSubtotal)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Revisión de Cotización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">{clientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Proyecto:</span>
                  <p className="font-medium">{project}</p>
                </div>
                {location && (
                  <div>
                    <span className="text-muted-foreground">Ubicación:</span>
                    <p className="font-medium">{location}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Item</th>
                      <th className="text-center p-3">Cant.</th>
                      <th className="text-center p-3">Dimensiones</th>
                      <th className="text-center p-3">Material</th>
                      <th className="text-right p-3">Unitario</th>
                      <th className="text-right p-3 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-3">{item.customName || item.templateName}</td>
                        <td className="text-center p-3">{item.quantity}</td>
                        <td className="text-center p-3 text-xs text-muted-foreground">
                          {item.width}×{item.height}×{item.depth}mm
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="secondary" className="text-xs">
                            {item.materialType || 'N/A'}
                          </Badge>
                        </td>
                        <td className="text-right p-3">{formatCOP(item.subtotal)}</td>
                        <td className="text-right p-3 font-medium">{formatCOP(item.totalSubtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Margin & Total */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCOP(subtotal)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Margen: {margin}%</span>
                    <span className="font-medium">{formatCOP(subtotal * margin / 100)}</span>
                  </div>
                  <Slider
                    value={[margin]}
                    onValueChange={([v]) => setMargin(v)}
                    min={0}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-lg font-bold">TOTAL:</span>
                  <span className="text-lg font-bold text-amber-700">{formatCOP(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 1 ? 'Cancelar' : 'Anterior'}
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="bg-amber-600 hover:bg-amber-700"
            disabled={step === 1 && (!clientName || !project)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Guardar Cotización
          </Button>
        )}
      </div>
    </div>
  );
}
