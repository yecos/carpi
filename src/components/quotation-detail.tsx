'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Printer,
  User,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCOP, formatDate, QUOTATION_STATUS, FURNITURE_TYPES } from '@/lib/format';
import { useState } from 'react';

interface ComponentBreakdown {
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

interface QuotationDetailProps {
  quotation: Quotation;
  onBack: () => void;
  onUpdate: () => void;
}

export function QuotationDetail({ quotation, onBack, onUpdate }: QuotationDetailProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      await fetch(`/api/quotations/${quotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success('Estado actualizado');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  }

  function toggleItem(index: number) {
    const newSet = new Set(expandedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedItems(newSet);
  }

  function handlePrint() {
    window.print();
  }

  const statusInfo = QUOTATION_STATUS[quotation.status as keyof typeof QUOTATION_STATUS];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div className="flex items-center gap-2">
          <Select
            value={quotation.status}
            onValueChange={updateStatus}
            disabled={updating}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUOTATION_STATUS).map(([key, info]) => (
                <SelectItem key={key} value={key}>{info.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="print:block">
        {/* Title Section */}
        <Card className="print:shadow-none print:border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Cotización</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(quotation.createdAt)}
                </p>
              </div>
              <Badge className={statusInfo?.color}>
                {statusInfo?.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{quotation.clientName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Proyecto</p>
                  <p className="font-medium">{quotation.project}</p>
                </div>
              </div>
              {quotation.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{quotation.location}</p>
                  </div>
                </div>
              )}
            </div>
            {quotation.notes && (
              <div className="mt-3 text-sm text-muted-foreground">
                <strong>Notas:</strong> {quotation.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mt-4 print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="text-lg">Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quotation.items.map((item, index) => {
              const isExpanded = expandedItems.has(index);
              let breakdown: ComponentBreakdown[] | null = null;
              if (item.detail) {
                try {
                  breakdown = JSON.parse(item.detail);
                } catch {
                  // ignore parse errors
                }
              }

              const itemName = item.customName || item.template?.name || 'Sin nombre';

              return (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleItem(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-50">
                          <FileText className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.width}×{item.height}×{item.depth || 0}mm
                            {item.materialType && ` • ${item.materialType}`}
                            {item.finishType && ` • ${item.finishType}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                        <span className="font-semibold">{formatCOP(item.subtotal * item.quantity)}</span>
                        {breakdown && (
                          isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && breakdown && (
                    <div className="border-t bg-muted/20">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2">Componente</th>
                            <th className="text-center p-2">Cant</th>
                            <th className="text-right p-2">Material</th>
                            <th className="text-right p-2">Canto</th>
                            <th className="text-right p-2">Herraje</th>
                            <th className="text-right p-2">MO</th>
                            <th className="text-right p-2 font-semibold">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.map((b, bi) => (
                            <tr key={bi} className="border-b last:border-0">
                              <td className="p-2">{b.componentName}</td>
                              <td className="text-center p-2">{b.quantity}</td>
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
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="mt-4 print:shadow-none print:border-0">
          <CardContent className="p-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCOP(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margen ({quotation.margin}%)</span>
                <span>{formatCOP(quotation.subtotal * quotation.margin / 100)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span className="text-amber-700">{formatCOP(quotation.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground print:mt-8">
          <p>Cotización generada por Cotizador Carpintería</p>
          <p>Válida por 15 días a partir de la fecha de emisión</p>
        </div>
      </div>
    </div>
  );
}
