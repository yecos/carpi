# Task: Archii Integration for Carpi

## Agent: Main Developer
## Status: Completed

## Summary
Integrated Carpi (carpentry quotation system) with Archii (architecture/interior design platform) using Firebase Auth, multi-tenant isolation, and REST API/webhook sync.

## Files Created
1. `/home/z/my-project/src/lib/archii-service.ts` - Archii API integration service
2. `/home/z/my-project/src/lib/auth-context.tsx` - Firebase Auth + tenant context provider
3. `/home/z/my-project/src/lib/use-tenant-fetch.ts` - Hook for tenant-aware API calls
4. `/home/z/my-project/src/components/archii-config.tsx` - Archii configuration UI
5. `/home/z/my-project/src/app/api/archii/projects/route.ts` - Proxy for Archii projects API
6. `/home/z/my-project/src/app/api/archii/sync/route.ts` - Sync quotation to Archii
7. `/home/z/my-project/src/app/api/archii/webhook/route.ts` - Receive webhook events from Archii

## Files Modified
1. `prisma/schema.prisma` - Added archiiTenantId to all models, archiiProjectId/archiiSyncedAt/archiiWebhookId to Quotation
2. `src/app/layout.tsx` - Wrapped app with AuthProvider
3. `src/app/page.tsx` - Added Archii config section, auth loading state
4. `src/components/app-sidebar.tsx` - Added Archii config nav item, tenant indicator, integración group
5. `src/components/dashboard-view.tsx` - Tenant-aware fetch
6. `src/components/quotations-view.tsx` - Tenant-aware fetch
7. `src/components/materials-view.tsx` - Tenant-aware fetch
8. `src/components/suppliers-view.tsx` - Tenant-aware fetch
9. `src/components/clients-view.tsx` - Tenant-aware fetch
10. `src/components/catalog-view.tsx` - Tenant-aware fetch
11. `src/components/comparison-view.tsx` - Tenant-aware fetch
12. `src/components/quotation-builder.tsx` - Archii project selector, auto-populate from project
13. `src/components/quotation-detail.tsx` - Tenant-aware fetch
14. All API routes - Added archiiTenantId filtering
15. `.env.example` - Added Firebase and Archii config vars

## Key Architecture Decisions
- Backward compatible: if no tenant selected, shows all data
- Archii integration is optional - app works standalone
- All Archii API calls go through Carpi backend (never client→Archii directly)
- Firebase Auth is shared with Archii project (same Firebase config)
- Tenant info stored in localStorage (client-side)
- API keys stored per-tenant in localStorage
