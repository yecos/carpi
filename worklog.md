---
Task ID: 1
Agent: Main Agent
Task: Premium redesign + all missing features for Carpentry Quotation System

Work Log:
- Updated Prisma schema with Client model, priceUpdatedAt field on Material, clientId on Quotation
- Ran db:push to apply schema changes
- Created premium CSS design system (globals.css) with amber/gold color palette, glassmorphism, premium shadows, dark mode support
- Updated layout.tsx with ThemeProvider from next-themes
- Created premium sidebar with dark charcoal background, amber accents, dark mode toggle, new nav items (Clientes, Comparador)
- Updated page.tsx to support new sections (clientes, comparador) with premium styling
- Created clients-view.tsx with full CRUD, premium cards, search functionality
- Created comparison-view.tsx with supplier price comparison tables, best price highlighting
- Created API routes: /api/clients, /api/clients/[id], /api/quotations/[id]/duplicate, /api/quotations/[id]/pdf, /api/materials/compare, /api/export/excel
- Updated materials API to support priceUpdatedAt
- Updated quotation detail API to include client relation
- Updated dashboard-view.tsx with premium stat cards, recharts bar/pie charts, gradient accents
- Updated quotations-view.tsx with edit, duplicate, PDF download buttons, premium styling
- Updated quotation-builder.tsx with edit mode (initialData prop), premium step indicator
- Updated quotation-detail.tsx with edit/duplicate/PDF buttons, premium layout
- Updated materials-view.tsx with premium gradient title, price stale alerts, Excel export
- Updated suppliers-view.tsx with premium gradient title
- Updated catalog-view.tsx with premium gradient title
- Updated format.ts with isPriceStale, formatDateRelative helpers

Stage Summary:
- All 12 features implemented or partially implemented
- Premium amber/gold design system with dark mode
- PDF generation via HTML print window
- Edit and duplicate quotations
- Client management section
- Supplier comparison tool
- Dashboard with recharts graphs
- Price staleness alerts on materials
- Excel export endpoint
- App is running on port 3000, all APIs returning 200
