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
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { formatCOP, formatDate, QUOTATION_STATUS, FURNITURE_TYPES } from '@/lib/format';
import type { Section } from './app-sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  items: Array<{ template: { type: string } | null }>;
}

export function DashboardView({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalQuotations: 0,
    thisMonth: 0,
    totalValue: 0,
    activeMaterials: 0,
    totalClients: 0,
  });
  const [recentQuotations, setRecentQuotations] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{ month: string; cotizaciones: number; valor: number }>>([]);
  const [typeDistribution, setTypeDistribution] = useState<Array<{ name: string; value: number; color: string }>>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [quotationsRes, materialsRes, clientsRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/materials'),
        fetch('/api/clients'),
      ]);

      const quotations = await quotationsRes.json();
      const materials = await materialsRes.json();
      const clients = await clientsRes.json();

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
        totalClients: clients.length,
      });

      setRecentQuotations(quotations.slice(0, 5));

      // Chart: Monthly quotations (last 6 months)
      const monthlyData: Record<string, { count: number; value: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('es-CO', { month: 'short' });
        monthlyData[key] = { count: 0, value: 0 };
      }
      quotations.forEach((q: QuotationSummary) => {
        const d = new Date(q.createdAt);
        const key = d.toLocaleDateString('es-CO', { month: 'short' });
        if (monthlyData[key]) {
          monthlyData[key].count++;
          monthlyData[key].value += q.total;
        }
      });
      setChartData(
        Object.entries(monthlyData).map(([month, data]) => ({
          month,
          cotizaciones: data.count,
          valor: data.value,
        }))
      );

      // Chart: Type distribution
      const typeCounts: Record<string, number> = {};
      quotations.forEach((q: QuotationSummary) => {
        q.items?.forEach((item) => {
          const type = item.template?.type || 'OTRO';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      });
      const colors = ['#b45309', '#92400e', '#d97706', '#78350f', '#f59e0b', '#854d0e', '#a16207'];
      setTypeDistribution(
        Object.entries(typeCounts).map(([type, value], i) => ({
          name: FURNITURE_TYPES[type as keyof typeof FURNITURE_TYPES] || type,
          value,
          color: colors[i % colors.length],
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { title: 'Total Cotizaciones', value: stats.totalQuotations, icon: FileText, gradient: 'from-amber-500 to-amber-700' },
    { title: 'Este Mes', value: stats.thisMonth, icon: Calendar, gradient: 'from-emerald-500 to-emerald-700' },
    { title: 'Valor Cotizado', value: formatCOP(stats.totalValue), icon: DollarSign, gradient: 'from-amber-600 to-amber-800' },
    { title: 'Materiales', value: stats.activeMaterials, icon: Package, gradient: 'from-orange-500 to-orange-700' },
    { title: 'Clientes', value: stats.totalClients, icon: Users, gradient: 'from-copper to-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>
        <Button
          onClick={() => onNavigate('cotizaciones')}
          className="gradient-amber hover:opacity-90 text-white border-0 shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-premium hover:shadow-premium-lg transition-all duration-300 overflow-hidden group">
            <CardContent className="p-4 relative">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-lg font-bold truncate">{typeof stat.value === 'number' ? stat.value : stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart - Monthly */}
        <Card className="lg:col-span-2 shadow-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              Cotizaciones por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 80)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="oklch(0.55 0.02 60)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.55 0.02 60)" />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.99 0.005 80)',
                      border: '1px solid oklch(0.90 0.01 80)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="cotizaciones" fill="oklch(0.75 0.155 65)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos suficientes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Type Distribution */}
        <Card className="shadow-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              Distribución por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos suficientes
              </div>
            )}
            {typeDistribution.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {typeDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Nueva Cotización', desc: 'Crear cotización nueva', icon: Plus, section: 'cotizaciones' as Section, gradient: 'from-amber-500 to-amber-700' },
          { label: 'Agregar Material', desc: 'Gestionar materiales', icon: Package, section: 'materiales' as Section, gradient: 'from-orange-500 to-orange-700' },
          { label: 'Ver Catálogo', desc: 'Plantillas de muebles', icon: TrendingUp, section: 'catalogo' as Section, gradient: 'from-emerald-500 to-emerald-700' },
        ].map((action) => (
          <Card
            key={action.label}
            className="cursor-pointer shadow-premium hover:shadow-premium-lg transition-all duration-300 group"
            onClick={() => onNavigate(action.section)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} shrink-0`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Quotations */}
      <Card className="shadow-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Cotizaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
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
                    className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-warm">
                        <FileText className="h-4 w-4 text-amber-700 dark:text-amber-400" />
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
                      <Badge className={statusInfo?.color}>
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
