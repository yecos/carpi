'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Package, Search, AlertTriangle, Download } from 'lucide-react';
import { formatCOP, MATERIAL_CATEGORIES, UNITS, isPriceStale, formatDateRelative } from '@/lib/format';

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  thickness: number | null;
  width: number | null;
  length: number | null;
  color: string | null;
  materialType: string | null;
  active: boolean;
  priceUpdatedAt: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

export function MaterialsView() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    category: 'TABLERO',
    unit: 'm2',
    price: 0,
    supplierId: '',
    thickness: '',
    width: '',
    length: '',
    color: '',
    materialType: '',
  });

  const loadMaterials = useCallback(async () => {
    try {
      const url = categoryFilter !== 'all' ? `/api/materials?category=${categoryFilter}` : '/api/materials';
      const res = await fetch(url);
      const data = await res.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
    loadSuppliers();
  }, [loadMaterials, loadSuppliers]);

  function openCreateDialog() {
    setEditingMaterial(null);
    setForm({
      name: '',
      category: 'TABLERO',
      unit: 'm2',
      price: 0,
      supplierId: '',
      thickness: '',
      width: '',
      length: '',
      color: '',
      materialType: '',
    });
    setDialogOpen(true);
  }

  function openEditDialog(material: Material) {
    setEditingMaterial(material);
    setForm({
      name: material.name,
      category: material.category,
      unit: material.unit,
      price: material.price,
      supplierId: material.supplierId || '',
      thickness: material.thickness?.toString() || '',
      width: material.width?.toString() || '',
      length: material.length?.toString() || '',
      color: material.color || '',
      materialType: material.materialType || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || form.price <= 0) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      const payload = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        price: form.price,
        supplierId: form.supplierId || null,
        thickness: form.thickness ? parseFloat(form.thickness) : null,
        width: form.width ? parseFloat(form.width) : null,
        length: form.length ? parseFloat(form.length) : null,
        color: form.color || null,
        materialType: form.materialType || null,
        priceUpdatedAt: new Date().toISOString(),
      };

      if (editingMaterial) {
        await fetch(`/api/materials/${editingMaterial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Material actualizado');
      } else {
        await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Material creado');
      }

      setDialogOpen(false);
      loadMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('Error al guardar material');
    }
  }

  async function handleDelete(material: Material) {
    try {
      await fetch(`/api/materials/${material.id}`, { method: 'DELETE' });
      toast.success('Material eliminado');
      setDeleteConfirm(null);
      loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Error al eliminar material');
    }
  }

  async function handleExportExcel() {
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'materials' }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materiales_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exportado');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar Excel');
    }
  }

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materialType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.color?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryTabs = [
    { value: 'all', label: 'Todos' },
    { value: 'TABLERO', label: 'Tableros' },
    { value: 'CANTO', label: 'Cantos' },
    { value: 'HERRAJE', label: 'Herrajes' },
    { value: 'ACABADO', label: 'Acabados' },
    { value: 'MANO_OBRA', label: 'Mano de Obra' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">Materiales</h1>
          <p className="text-muted-foreground">Gestión de materiales e insumos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button onClick={openCreateDialog} className="gradient-amber text-white hover:opacity-90 shadow-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Material
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full sm:w-auto">
          <TabsList className="flex-wrap h-auto gap-1">
            {categoryTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Materials Table */}
      <Card className="shadow-premium overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Categoría</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Unidad</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Precio</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Proveedor</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={8} className="p-3">
                        <div className="h-5 bg-muted animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      No se encontraron materiales
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((material) => {
                    const stale = isPriceStale(material.priceUpdatedAt);
                    return (
                      <tr key={material.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-sm">{material.name}</p>
                            {material.color && (
                              <p className="text-xs text-muted-foreground">{material.color}</p>
                            )}
                            {material.thickness && (
                              <p className="text-xs text-muted-foreground">{material.thickness}mm</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-xs">
                            {MATERIAL_CATEGORIES[material.category as keyof typeof MATERIAL_CATEGORIES] || material.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{material.materialType || '-'}</td>
                        <td className="p-3 text-sm">{UNITS[material.unit as keyof typeof UNITS] || material.unit}</td>
                        <td className="p-3 text-right font-medium text-sm">{formatCOP(material.price)}</td>
                        <td className="p-3 text-sm">{material.supplier?.name || '-'}</td>
                        <td className="p-3 text-center">
                          {stale ? (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Desactualizado
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              Actualizado
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(material)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteConfirm(material)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoría *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATERIAL_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Unidad *</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNITS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio *</Label>
                <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Proveedor</Label>
                <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="materialType">Tipo Material</Label>
                <Input id="materialType" placeholder="MDF, Melamina..." value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="thickness">Espesor (mm)</Label>
                <Input id="thickness" type="number" value={form.thickness} onChange={(e) => setForm({ ...form, thickness: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="width">Ancho (mm)</Label>
                <Input id="width" type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="length">Largo (mm)</Label>
                <Input id="length" type="number" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gradient-amber text-white hover:opacity-90">
              {editingMaterial ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará el material &quot;{deleteConfirm?.name}&quot;. Esta acción se puede revertir.
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
