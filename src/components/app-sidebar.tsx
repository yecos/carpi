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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type Section = 'dashboard' | 'materiales' | 'proveedores' | 'catalogo' | 'cotizaciones';

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
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'materiales', label: 'Materiales', icon: Package },
  { id: 'proveedores', label: 'Proveedores', icon: Truck },
  { id: 'catalogo', label: 'Catálogo', icon: BookOpen },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
];

export function AppSidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-300 h-full',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 px-4 py-5 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white shrink-0">
            <Hammer className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight">Cotizador</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Carpintería</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            const button = (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-amber-700')} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
