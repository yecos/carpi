'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  TrendingUp,
  Package,
  Plus,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { formatCOP, formatDate, QUOTATION_STATUS } from '@/lib/format';
import type { Section } from './app-sidebar';

interface DashboardProps {
  onNavigate: (section: Section) => void;
}

interface QuotationSummary {
  id: string;
  clientName: string;
  project: string;
  total: number;
  status: string;
  createdAt: string;
}

export function DashboardView({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalQuotations: 0,
    thisMonth: 0,
    totalValue: 0,
    activeMaterials: 0,
  });
  const [recentQuotations, setRecentQuotations] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [quotationsRes, materialsRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/materials'),
      ]);

      const quotations = await quotationsRes.json();
      const materials = await materialsRes.json();

      const now = new Date();
      const thisMonth = quotations.filter((q: QuotationSummary) => {
        const d = new Date(q.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setStats({
        totalQuotations: quotations.length,
        thisMonth: thisMonth.length,
        totalValue: quotations.reduce((sum: number, q: QuotationSummary) => sum + q.total, 0),
        activeMaterials: materials.length,
      });

      setRecentQuotations(quotations.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Cotizaciones',
      value: stats.totalQuotations,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Este Mes',
      value: stats.thisMonth,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Valor Total Cotizado',
      value: formatCOP(stats.totalValue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Materiales Activos',
      value: stats.activeMaterials,
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>
        <Button
          onClick={() => onNavigate('cotizaciones')}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">
                    {typeof stat.value === 'number' ? stat.value : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('cotizaciones')}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <Plus className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold">Nueva Cotización</p>
              <p className="text-sm text-muted-foreground">Crear cotización nueva</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('materiales')}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-50">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold">Agregar Material</p>
              <p className="text-sm text-muted-foreground">Gestionar materiales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('catalogo')}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Ver Catálogo</p>
              <p className="text-sm text-muted-foreground">Plantillas de muebles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cotizaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : recentQuotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay cotizaciones aún</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onNavigate('cotizaciones')}
              >
                Crear primera cotización
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentQuotations.map((q) => {
                const statusInfo = QUOTATION_STATUS[q.status as keyof typeof QUOTATION_STATUS];
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{q.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.project} • {formatDate(q.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{formatCOP(q.total)}</span>
                      <Badge variant="secondary" className={statusInfo?.color}>
                        {statusInfo?.label || q.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
