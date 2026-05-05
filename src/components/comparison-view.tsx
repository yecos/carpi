'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatCOP, MATERIAL_CATEGORIES } from '@/lib/format';
import { useTenantFetch } from '@/lib/use-tenant-fetch';

interface CompareData {
  grouped: Record<string, Record<string, Array<{
    materialId: string;
    materialName: string;
    supplierId: string;
    supplierName: string;
    price: number;
    unit: string;
  }>>>;
  suppliers: Array<{ id: string; name: string }>;
}

export function ComparisonView() {
  const { tenantFetch } = useTenantFetch();
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const res = await tenantFetch('/api/materials/compare');
      const d = await res.json();
      setData(d);
    } catch (error) {
      console.error('Error loading comparison:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-5"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const categories = Object.keys(data.grouped);

  const filteredCategories = categoryFilter === 'all'
    ? categories
    : categories.filter(c => {
        const catMap: Record<string, string> = { 'MDF': 'TABLERO', 'Melamina': 'TABLERO', 'Madera': 'TABLERO', 'PVC': 'CANTO', 'Bisagra': 'HERRAJE', 'Corredera': 'HERRAJE', 'Tirador': 'HERRAJE', 'Soporte': 'HERRAJE', 'Tornillo': 'HERRAJE', 'Minifix': 'HERRAJE', 'Lacado': 'ACABADO', 'Barniz': 'ACABADO', 'Poliuretano': 'ACABADO', 'Corte': 'MANO_OBRA', 'Ensamble': 'MANO_OBRA', 'Instalación': 'MANO_OBRA' };
        return catMap[c] === categoryFilter;
      });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
          Comparador de Proveedores
        </h1>
        <p className="text-muted-foreground">Compara precios entre proveedores y encuentra el mejor precio</p>
      </div>

      {/* Category Filter */}
      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
          {Object.entries(MATERIAL_CATEGORIES).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs">{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Comparison Tables */}
      {filteredCategories.length === 0 ? (
        <Card className="shadow-premium">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay datos para comparar</p>
          </CardContent>
        </Card>
      ) : (
        filteredCategories.map((type) => {
          const materials = data.grouped[type];
          if (!materials) return null;

          return (
            <Card key={type} className="shadow-premium">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-lg gradient-warm">
                    <BarChart3 className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  {type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground">Material</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Unidad</th>
                        {data.suppliers.map((s) => (
                          <th key={s.id} className="text-right p-3 font-medium text-muted-foreground">{s.name}</th>
                        ))}
                        <th className="text-center p-3 font-medium text-muted-foreground">Mejor Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(materials).map(([name, prices]) => {
                        const minPrice = Math.min(...prices.filter(p => p.supplierName !== 'Sin proveedor').map(p => p.price));
                        const maxPrice = Math.max(...prices.filter(p => p.supplierName !== 'Sin proveedor').map(p => p.price));
                        const unit = prices[0]?.unit || '';
                        const savings = maxPrice > minPrice ? ((maxPrice - minPrice) / maxPrice * 100) : 0;

                        return (
                          <tr key={name} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium">{name}</td>
                            <td className="p-3 text-muted-foreground">{unit}</td>
                            {data.suppliers.map((s) => {
                              const price = prices.find(p => p.supplierId === s.id);
                              const isBest = price && price.price === minPrice && price.supplierName !== 'Sin proveedor';
                              const isWorst = price && price.price === maxPrice && maxPrice !== minPrice && price.supplierName !== 'Sin proveedor';
                              return (
                                <td key={s.id} className="p-3 text-right">
                                  {price ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isBest && <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />}
                                      {isWorst && <TrendingUp className="h-3.5 w-3.5 text-red-500" />}
                                      {!isBest && !isWorst && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                                      <span className={isBest ? 'font-bold text-emerald-700 dark:text-emerald-400' : isWorst ? 'text-red-600 dark:text-red-400' : ''}>
                                        {formatCOP(price.price)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-3 text-center">
                              {savings > 0 ? (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">
                                  Ahorro {savings.toFixed(0)}%
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Mismo precio</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
