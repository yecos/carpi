'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  GripVertical,
} from 'lucide-react';
import { FURNITURE_TYPES, MATERIAL_CATEGORIES } from '@/lib/format';

interface FurnitureComponent {
  id?: string;
  name: string;
  quantity: number;
  widthFormula: string;
  heightFormula: string;
  depthFormula: string;
  materialCategory: string;
  materialId: string;
  needsEdge: boolean;
  edgeSides: number;
  edgeType: string;
  hardwareList: string;
  laborHours: number;
}

interface FurnitureTemplate {
  id: string;
  name: string;
  type: string;
  description: string | null;
  active: boolean;
  components: FurnitureComponent[];
}

interface Material {
  id: string;
  name: string;
  category: string;
}

export function CatalogView() {
  const [templates, setTemplates] = useState<FurnitureTemplate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FurnitureTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FurnitureTemplate | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: 'COCINA',
    description: '',
  });
  const [formComponents, setFormComponents] = useState<FurnitureComponent[]>([]);

  const loadTemplates = useCallback(async () => {
    try {
      const url = typeFilter !== 'all' ? `/api/furniture?type=${typeFilter}` : '/api/furniture';
      const res = await fetch(url);
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar catálogo');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  const loadMaterials = useCallback(async () => {
    try {
      const res = await fetch('/api/materials');
      const data = await res.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadMaterials();
  }, [loadTemplates, loadMaterials]);

  function openCreateDialog() {
    setEditingTemplate(null);
    setForm({ name: '', type: 'COCINA', description: '' });
    setFormComponents([
      {
        name: '',
        quantity: 1,
        widthFormula: '',
        heightFormula: '',
        depthFormula: '',
        materialCategory: 'TABLERO',
        materialId: '',
        needsEdge: false,
        edgeSides: 0,
        edgeType: '',
        hardwareList: '',
        laborHours: 0,
      },
    ]);
    setDialogOpen(true);
  }

  function openEditDialog(template: FurnitureTemplate) {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      type: template.type,
      description: template.description || '',
    });
    setFormComponents(
      template.components.map((c) => ({
        ...c,
        depthFormula: c.depthFormula || '',
        materialId: c.materialId || '',
        edgeType: c.edgeType || '',
        hardwareList: c.hardwareList || '',
        laborHours: c.laborHours || 0,
      }))
    );
    setDialogOpen(true);
  }

  function addComponent() {
    setFormComponents([
      ...formComponents,
      {
        name: '',
        quantity: 1,
        widthFormula: '',
        heightFormula: '',
        depthFormula: '',
        materialCategory: 'TABLERO',
        materialId: '',
        needsEdge: false,
        edgeSides: 0,
        edgeType: '',
        hardwareList: '',
        laborHours: 0,
      },
    ]);
  }

  function removeComponent(index: number) {
    setFormComponents(formComponents.filter((_, i) => i !== index));
  }

  function updateComponent(index: number, field: keyof FurnitureComponent, value: string | number | boolean) {
    const updated = [...formComponents];
    updated[index] = { ...updated[index], [field]: value };
    setFormComponents(updated);
  }

  async function handleSave() {
    if (!form.name) {
      toast.error('El nombre es requerido');
      return;
    }

    if (formComponents.some((c) => !c.name || !c.widthFormula || !c.heightFormula)) {
      toast.error('Complete nombre y fórmulas para todos los componentes');
      return;
    }

    try {
      const payload = {
        name: form.name,
        type: form.type,
        description: form.description || null,
        components: formComponents.map((c) => ({
          name: c.name,
          quantity: c.quantity,
          widthFormula: c.widthFormula,
          heightFormula: c.heightFormula,
          depthFormula: c.depthFormula || null,
          materialCategory: c.materialCategory,
          materialId: c.materialId || null,
          needsEdge: c.needsEdge,
          edgeSides: c.edgeSides,
          edgeType: c.edgeType || null,
          hardwareList: c.hardwareList || null,
          laborHours: c.laborHours,
        })),
      };

      if (editingTemplate) {
        await fetch(`/api/furniture/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Plantilla actualizada');
      } else {
        await fetch('/api/furniture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Plantilla creada');
      }

      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar plantilla');
    }
  }

  async function handleDelete(template: FurnitureTemplate) {
    try {
      await fetch(`/api/furniture/${template.id}`, { method: 'DELETE' });
      toast.success('Plantilla eliminada');
      setDeleteConfirm(null);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar plantilla');
    }
  }

  const typeGroups = templates.reduce<Record<string, FurnitureTemplate[]>>((acc, t) => {
    if (!acc[t.type]) acc[t.type] = [];
    acc[t.type].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Mobiliario</h1>
          <p className="text-muted-foreground">Plantillas y componentes de muebles</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Type Filter */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
          {Object.entries(FURNITURE_TYPES).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs">{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Templates */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay plantillas en el catálogo</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={openCreateDialog}>
            Crear plantilla
          </Button>
        </div>
      ) : (
        Object.entries(typeGroups).map(([type, items]) => (
          <div key={type} className="space-y-3">
            <h2 className="text-lg font-semibold">
              {FURNITURE_TYPES[type as keyof typeof FURNITURE_TYPES] || type}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((template) => {
                const isExpanded = expandedId === template.id;
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {FURNITURE_TYPES[template.type as keyof typeof FURNITURE_TYPES]}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(template)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteConfirm(template)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {template.components.length} componentes
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setExpandedId(isExpanded ? null : template.id)}
                        >
                          {isExpanded ? 'Ocultar' : 'Ver componentes'}
                          {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                        </Button>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                          {template.components.map((comp, i) => (
                            <div key={comp.id || i} className="p-2 rounded border bg-muted/30 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{comp.name}</span>
                                <Badge variant="secondary" className="text-[10px] h-4">
                                  {MATERIAL_CATEGORIES[comp.materialCategory as keyof typeof MATERIAL_CATEGORIES]}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground space-y-0.5">
                                <p>Cant: {comp.quantity} • Fórmula: {comp.widthFormula} × {comp.heightFormula}</p>
                                {comp.needsEdge && <p>Canto: {comp.edgeSides} lados</p>}
                                {comp.laborHours > 0 && <p>Horas MO: {comp.laborHours}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FURNITURE_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            {/* Components */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Componentes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {formComponents.map((comp, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Componente {i + 1}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeComponent(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input placeholder="Nombre del componente" value={comp.name} onChange={(e) => updateComponent(i, 'name', e.target.value)} />
                      </div>
                      <Input type="number" placeholder="Cantidad" value={comp.quantity} onChange={(e) => updateComponent(i, 'quantity', parseFloat(e.target.value) || 1)} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Fórmula Ancho</Label>
                        <Input placeholder="ancho - 36" value={comp.widthFormula} onChange={(e) => updateComponent(i, 'widthFormula', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Fórmula Alto</Label>
                        <Input placeholder="alto - 100" value={comp.heightFormula} onChange={(e) => updateComponent(i, 'heightFormula', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Fórmula Prof.</Label>
                        <Input placeholder="profundidad - 4" value={comp.depthFormula} onChange={(e) => updateComponent(i, 'depthFormula', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Categoría Material</Label>
                        <Select value={comp.materialCategory} onValueChange={(v) => updateComponent(i, 'materialCategory', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(MATERIAL_CATEGORIES).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Material Específico</Label>
                        <Select value={comp.materialId || 'none'} onValueChange={(v) => updateComponent(i, 'materialId', v === 'none' ? '' : v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Auto" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Auto (por tipo)</SelectItem>
                            {materials
                              .filter((m) => m.category === comp.materialCategory)
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Horas MO</Label>
                        <Input type="number" step="0.1" value={comp.laborHours} onChange={(e) => updateComponent(i, 'laborHours', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={comp.needsEdge}
                          onChange={(e) => updateComponent(i, 'needsEdge', e.target.checked)}
                          className="rounded"
                        />
                        Requiere canto
                      </label>
                      {comp.needsEdge && (
                        <>
                          <div className="flex items-center gap-1">
                            <Label className="text-xs">Lados:</Label>
                            <Input type="number" className="w-14 h-7 text-xs" value={comp.edgeSides} onChange={(e) => updateComponent(i, 'edgeSides', parseInt(e.target.value) || 0)} />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label className="text-xs">Tipo:</Label>
                            <Input className="w-20 h-7 text-xs" placeholder="PVC" value={comp.edgeType} onChange={(e) => updateComponent(i, 'edgeType', e.target.value)} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
              {editingTemplate ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará la plantilla &quot;{deleteConfirm?.name}&quot; y todos sus componentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
