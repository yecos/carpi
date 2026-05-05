'use client';

import { useState, useEffect } from 'react';
import { AppSidebar, type Section } from '@/components/app-sidebar';
import { DashboardView } from '@/components/dashboard-view';
import { MaterialsView } from '@/components/materials-view';
import { SuppliersView } from '@/components/suppliers-view';
import { CatalogView } from '@/components/catalog-view';
import { QuotationsView } from '@/components/quotations-view';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Hammer } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Auto-seed on first load
  useEffect(() => {
    if (!seeded) {
      checkAndSeed();
    }
  }, [seeded]);

  async function checkAndSeed() {
    try {
      const res = await fetch('/api/materials');
      const materials = await res.json();
      if (materials.length === 0) {
        await handleSeed();
      }
      setSeeded(true);
    } catch {
      // ignore
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      toast.success(`Base de datos poblada: ${data.materials} materiales, ${data.templates} plantillas`);
      setSeeded(true);
    } catch (error) {
      console.error('Error seeding:', error);
      toast.error('Error al poblar base de datos');
    } finally {
      setSeeding(false);
    }
  }

  function handleSectionChange(section: Section) {
    setActiveSection(section);
    setMobileMenuOpen(false);
  }

  function renderContent() {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView onNavigate={handleSectionChange} />;
      case 'materiales':
        return <MaterialsView />;
      case 'proveedores':
        return <SuppliersView />;
      case 'catalogo':
        return <CatalogView />;
      case 'cotizaciones':
        return <QuotationsView />;
      default:
        return <DashboardView onNavigate={handleSectionChange} />;
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
              <Hammer className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">Cotizador Carpintería</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="text-xs"
            >
              {seeding ? 'Cargando...' : 'Cargar Datos'}
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-56">
                <AppSidebar
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                  collapsed={false}
                  onToggleCollapse={() => setMobileMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-6">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground bg-card">
          Cotizador Carpintería — Sistema de Cotizaciones para Carpintería de Interiores
        </footer>
      </div>
    </div>
  );
}
