'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Trash2,
  Eye,
  FileText,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { formatCOP, formatDate, QUOTATION_STATUS, FURNITURE_TYPES } from '@/lib/format';
import { QuotationBuilder } from './quotation-builder';
import { QuotationDetail } from './quotation-detail';

interface QuotationItem {
  id: string;
  templateId: string | null;
  customName: string | null;
  width: number;
  height: number;
  depth: number | null;
  quantity: number;
  materialType: string | null;
  finishType: string | null;
  subtotal: number;
  detail: string | null;
  template: { name: string; type: string } | null;
}

interface Quotation {
  id: string;
  clientName: string;
  project: string;
  location: string | null;
  notes: string | null;
  subtotal: number;
  margin: number;
  total: number;
  status: string;
  createdAt: string;
  items: QuotationItem[];
}

type ViewMode = 'list' | 'create' | 'detail';

export function QuotationsView() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Quotation | null>(null);

  const loadQuotations = useCallback(async () => {
    try {
      const url = statusFilter !== 'all' ? `/api/quotations?status=${statusFilter}` : '/api/quotations';
      const res = await fetch(url);
      const data = await res.json();
      setQuotations(data);
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  async function handleSaveQuotation(data: {
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
      detail: unknown;
    }>;
  }) {
    try {
      const subtotal = data.items.reduce((sum, item) => sum + item.subtotal * item.quantity, 0);
      const marginAmount = subtotal * data.margin / 100;
      const total = subtotal + marginAmount;

      await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: data.clientName,
          project: data.project,
          location: data.location || null,
          notes: data.notes || null,
          margin: data.margin,
          subtotal,
          total,
          status: 'BORRADOR',
          items: data.items,
        }),
      });

      toast.success('Cotización creada exitosamente');
      setViewMode('list');
      loadQuotations();
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Error al guardar cotización');
    }
  }

  async function handleDelete(quotation: Quotation) {
    try {
      await fetch(`/api/quotations/${quotation.id}`, { method: 'DELETE' });
      toast.success('Cotización eliminada');
      setDeleteConfirm(null);
      loadQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error('Error al eliminar cotización');
    }
  }

  async function viewQuotation(id: string) {
    try {
      const res = await fetch(`/api/quotations/${id}`);
      const data = await res.json();
      setSelectedQuotation(data);
      setViewMode('detail');
    } catch (error) {
      console.error('Error loading quotation:', error);
      toast.error('Error al cargar cotización');
    }
  }

  const filteredQuotations = quotations.filter(
    (q) =>
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Quotation Builder
  if (viewMode === 'create') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setViewMode('list')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <h1 className="text-2xl font-bold">Nueva Cotización</h1>
        </div>
        <QuotationBuilder
          onSave={handleSaveQuotation}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  // Render Quotation Detail
  if (viewMode === 'detail' && selectedQuotation) {
    return (
      <QuotationDetail
        quotation={selectedQuotation}
        onBack={() => {
          setViewMode('list');
          setSelectedQuotation(null);
        }}
        onUpdate={() => {
          viewQuotation(selectedQuotation.id);
          loadQuotations();
        }}
      />
    );
  }

  // Render List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestión de cotizaciones de carpintería</p>
        </div>
        <Button
          onClick={() => setViewMode('create')}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
            {Object.entries(QUOTATION_STATUS).map(([key, info]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {info.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o proyecto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Quotations List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuotations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay cotizaciones</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setViewMode('create')}
            >
              Crear primera cotización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
          {filteredQuotations.map((q) => {
            const statusInfo = QUOTATION_STATUS[q.status as keyof typeof QUOTATION_STATUS];
            return (
              <Card key={q.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-50 mt-0.5">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{q.clientName}</h3>
                          <Badge className={statusInfo?.color}>
                            {statusInfo?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {q.project}
                          {q.location && ` • ${q.location}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{q.items.length} items</span>
                          <span>{formatDate(q.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-amber-700">{formatCOP(q.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          Margen: {q.margin}%
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => viewQuotation(q.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => setDeleteConfirm(q)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la cotización de &quot;{deleteConfirm?.clientName}&quot;.
              Esta acción no se puede deshacer.
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
