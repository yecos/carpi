# 🪚 Carpi — Cotizador de Carpintería

Sistema automatizado de cotizaciones de carpintería para proyectos de diseño de interiores. Genera cotizaciones rápidas y precisas sin depender de tiempos de respuesta de proveedores.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)

---

## ✨ Características

- **Dashboard** — Vista general de cotizaciones, métricas y gráficos
- **Materiales** — Base de datos de materiales con precios actualizados (MDF, melamina, madera natural, herrajes, cantos, acabados)
- **Proveedores** — Gestión de proveedores con comparador de precios
- **Catálogo** — Plantillas paramétricas de mobiliario (cocinas, closets, baños, sala, oficina, comedor)
- **Cotizaciones** — Creación, edición, duplicación y exportación PDF/Excel
- **Clientes** — CRUD completo con historial de cotizaciones
- **AI Vision** — Análisis de fotos de muebles para estimar uso de materiales
- **Comparador** — Comparación de precios entre proveedores
- **Modo Oscuro** — Soporte completo con next-themes

---

## 🧮 Motor de Cálculo

El sistema calcula automáticamente los costos basándose en:

| Componente | Fórmula |
|---|---|
| **Tableros** | Área (m²) × precio + 12% desperdicio |
| **Cantos** | Perímetro lineal (ml) × precio |
| **Herrajes** | Cantidad × precio unitario |
| **Mano de obra** | Horas estimadas × tarifa/hora |
| **Margen** | Subtotal × % margen configurado |

---

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **IA**: z-ai-web-dev-sdk (análisis de imágenes)
- **Gráficos**: Recharts
- **Exportación**: xlsx (Excel), jsPDF (PDF)

---

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/yecos/carpi.git
cd carpi

# Instalar dependencias
bun install

# Configurar base de datos
cp .env.example .env
bunx prisma db push
bunx prisma generate

# Cargar datos iniciales (seed)
curl http://localhost:3000/api/seed

# Iniciar desarrollo
bun dev
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── materials/        # CRUD materiales + comparador
│   │   ├── suppliers/        # CRUD proveedores
│   │   ├── furniture/        # CRUD catálogo mobiliario
│   │   ├── quotations/       # CRUD cotizaciones + cálculo + PDF + duplicar
│   │   ├── clients/          # CRUD clientes
│   │   ├── export/           # Exportación Excel
│   │   └── analyze-furniture/ # AI Vision
│   ├── layout.tsx
│   └── page.tsx              # Dashboard principal
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   ├── app-sidebar.tsx       # Navegación lateral
│   ├── dashboard-view.tsx    # Vista dashboard
│   ├── materials-view.tsx    # Vista materiales
│   ├── suppliers-view.tsx    # Vista proveedores
│   ├── catalog-view.tsx      # Vista catálogo
│   ├── quotations-view.tsx   # Vista cotizaciones
│   ├── quotation-builder.tsx # Constructor de cotizaciones
│   ├── quotation-detail.tsx  # Detalle de cotización
│   ├── clients-view.tsx      # Vista clientes
│   ├── comparison-view.tsx   # Comparador precios
│   └── photo-analyzer.tsx    # Análisis AI Vision
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── calculations.ts       # Motor de cálculo
│   ├── format.ts             # Formateo moneda COP
│   └── utils.ts              # Utilidades
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.ts
└── prisma/
    └── schema.prisma         # Esquema de base de datos
```

## 💰 Moneda

Todos los precios están en **COP (Pesos Colombianos)** con formato `$ 1.234.567`.

## 📋 Variables de Entorno

```env
DATABASE_URL=file:./dev.db
```

---

Desarrollado con ❤️ para diseñadores de interiores y carpinteros en Colombia.
