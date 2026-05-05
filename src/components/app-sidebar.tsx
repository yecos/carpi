'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Truck,
  BookOpen,
  FileText,
  Hammer,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';

export type Section = 'dashboard' | 'materiales' | 'proveedores' | 'catalogo' | 'cotizaciones' | 'clientes' | 'comparador';

interface AppSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: Array<{
  id: Section;
  label: string;
  icon: React.ElementType;
  group: string;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'general' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, group: 'general' },
  { id: 'clientes', label: 'Clientes', icon: Users, group: 'datos' },
  { id: 'materiales', label: 'Materiales', icon: Package, group: 'datos' },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, group: 'datos' },
  { id: 'catalogo', label: 'Catálogo', icon: BookOpen, group: 'datos' },
  { id: 'comparador', label: 'Comparador', icon: BarChart3, group: 'herramientas' },
];

export function AppSidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme();

  const groups = ['general', 'datos', 'herramientas'] as const;
  const groupLabels: Record<string, string> = {
    general: 'General',
    datos: 'Datos',
    herramientas: 'Herramientas',
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 h-full border-r border-sidebar-border',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-amber shrink-0 shadow-md">
            <Hammer className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground leading-tight">Cotizador</span>
              <span className="text-[10px] text-sidebar-foreground/60 leading-tight">Carpintería Premium</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
          {groups.map((group) => {
            const items = navItems.filter((i) => i.group === group);
            return (
              <div key={group} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1">
                    {groupLabels[group]}
                  </p>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  const button = (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-primary/20 text-sidebar-primary shadow-sm glow-amber'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        collapsed && 'justify-center px-0',
                        isActive && !collapsed && 'border border-sidebar-primary/30'
                      )}
                    >
                      <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive && 'text-sidebar-primary')} />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium bg-popover text-popover-foreground">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span className="ml-2 text-xs">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              'w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="ml-2 text-xs">Colapsar</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
