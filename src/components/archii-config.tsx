'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Building2,
  Key,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

interface ArchiiConfigProps {
  onClose?: () => void;
}

export function ArchiiConfig({ onClose }: ArchiiConfigProps) {
  const {
    isFirebaseConfigured,
    tenants,
    addTenant,
    removeTenant,
    setArchiiApiKey,
    currentTenantId,
    setCurrentTenant,
  } = useAuth();

  const [newTenantId, setNewTenantId] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [archiiUrl, setArchiiUrl] = useState(
    process.env.NEXT_PUBLIC_ARCHII_API_URL || 'https://archii-theta.vercel.app'
  );
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  async function testConnection(tenantId: string, apiKey: string) {
    if (!apiKey) {
      toast.error('Ingrese la API Key primero');
      return;
    }
    setTesting(tenantId);
    try {
      const res = await fetch('/api/archii/projects?tenantId=1&limit=1', {
        headers: {
          'X-Archii-Api-Key': apiKey,
          'X-Archii-Tenant-Id': tenantId,
        },
      });
      const data = await res.json();
      const success = res.ok;
      setTestResults(prev => ({
        ...prev,
        [tenantId]: {
          success,
          message: success
            ? `Conexión exitosa - ${data.projects?.length || 0} proyectos encontrados`
            : `Error: ${data.error || 'No se pudo conectar'}`,
        },
      }));
      toast[success ? 'success' : 'error'](
        success ? 'Conexión exitosa con Archii' : 'Error al conectar con Archii'
      );
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [tenantId]: {
          success: false,
          message: 'Error de conexión',
        },
      }));
      toast.error('Error de conexión');
    } finally {
      setTesting(null);
    }
  }

  function handleAddTenant() {
    if (!newTenantId.trim() || !newTenantName.trim()) {
      toast.error('Complete el ID y nombre del tenant');
      return;
    }
    addTenant({
      id: newTenantId.trim(),
      name: newTenantName.trim(),
      apiKey: newApiKey.trim(),
    });
    setNewTenantId('');
    setNewTenantName('');
    setNewApiKey('');
    toast.success('Tenant agregado');
  }

  function handleUpdateApiKey(tenantId: string, apiKey: string) {
    setArchiiApiKey(apiKey, tenantId);
    toast.success('API Key actualizada');
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
            Configuración Archii
          </h1>
          <p className="text-muted-foreground">Conecta Carpi con Archii para sincronizar proyectos</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
        )}
      </div>

      {/* Firebase Status */}
      <Card className="shadow-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4 text-amber-600" />
            Estado de Firebase Auth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {isFirebaseConfigured ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Firebase Configurado
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                <XCircle className="h-3 w-3" />
                Firebase No Configurado (Modo Local)
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              {isFirebaseConfigured
                ? 'Autenticación compartida con Archii activa'
                : 'Configure las variables de entorno de Firebase para autenticación compartida'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Archii API URL */}
      <Card className="shadow-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-600" />
            URL de Archii API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              value={archiiUrl}
              onChange={(e) => setArchiiUrl(e.target.value)}
              placeholder="https://archii-theta.vercel.app"
              className="max-w-md"
            />
            <Badge variant="secondary" className="text-xs">
              {archiiUrl === 'https://archii-theta.vercel.app' ? 'Default' : 'Custom'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tenants */}
      <Card className="shadow-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-600" />
            Tenants (Organizaciones)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No hay tenants configurados</p>
              <p className="text-xs mt-1">Agregue un tenant para conectar con Archii</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tenants.map((tenant) => {
                const testResult = testResults[tenant.id];
                const isCurrent = tenant.id === currentTenantId;
                return (
                  <div
                    key={tenant.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isCurrent
                        ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-900/10'
                        : 'hover:border-amber-200 dark:hover:border-amber-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isCurrent ? 'gradient-amber text-white' : 'gradient-warm'}`}>
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{tenant.name}</h3>
                            {isCurrent && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">
                                Activo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{tenant.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setCurrentTenant(tenant.id)}
                          >
                            Seleccionar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => removeTenant(tenant.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <form onSubmit={(e) => e.preventDefault()} className="flex-1">
                      <Input
                        type="password"
                        autoComplete="off"
                        placeholder="API Key de Archii"
                        defaultValue={tenant.apiKey}
                        onBlur={(e) => handleUpdateApiKey(tenant.id, e.target.value)}
                        className="h-8 text-xs"
                      />
                      </form>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 shrink-0"
                        onClick={() => {
                          const input = document.querySelector(`[data-tenant-key="${tenant.id}"]`) as HTMLInputElement;
                          testConnection(tenant.id, tenant.apiKey || input?.value || '');
                        }}
                        disabled={testing === tenant.id}
                      >
                        {testing === tenant.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Link2 className="h-3 w-3" />
                        )}
                        Probar
                      </Button>
                    </div>

                    {testResult && (
                      <div className={`mt-2 text-xs flex items-center gap-1.5 ${testResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                        {testResult.success ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Tenant Form */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Agregar Tenant</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="grid gap-1">
                <Label className="text-xs">ID del Tenant</Label>
                <Input
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  placeholder="tenant-001"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Mi Empresa"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">API Key</Label>
                <div className="flex gap-1">
                  <form onSubmit={(e) => e.preventDefault()} className="flex-1">
                  <Input
                    type="password"
                    autoComplete="off"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="archii-ak-..."
                    className="h-8 text-xs"
                  />
                  </form>
                  <Button
                    size="sm"
                    className="h-8 gradient-amber text-white hover:opacity-90 shrink-0"
                    onClick={handleAddTenant}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="shadow-premium border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Link2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">¿Cómo funciona la integración con Archii?</p>
              <p>• <strong>Autenticación compartida:</strong> Carpi usa el mismo proyecto Firebase que Archii</p>
              <p>• <strong>Proyectos:</strong> Los proyectos se leen desde la API de Archii y se asocian a cotizaciones</p>
              <p>• <strong>Sincronización:</strong> Las cotizaciones finalizadas se envían de vuelta a Archii vía webhook</p>
              <p>• <strong>Multi-tenant:</strong> Cada registro tiene un <code className="bg-muted px-1 rounded">archiiTenantId</code> para aislamiento</p>
              <p>• <strong>Modo independiente:</strong> Carpi funciona sin Archii, la integración es opcional</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
