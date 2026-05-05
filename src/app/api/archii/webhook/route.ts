import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateWebhookEvent, type ArchiiWebhookEvent } from '@/lib/archii-service';

// POST /api/archii/webhook - Receive webhook events from Archii
export async function POST(request: Request) {
  try {
    const signature = request.headers.get('X-Archii-Signature') || '';
    const webhookSecret = process.env.ARCHII_WEBHOOK_SECRET || '';

    const body = await request.text();

    // Validate webhook signature if secret is configured
    if (webhookSecret && !validateWebhookEvent(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 401 });
    }

    const event: ArchiiWebhookEvent = JSON.parse(body);

    // Process the webhook event
    switch (event.event) {
      case 'project.updated': {
        // Handle project update from Archii
        console.log(`[Archii Webhook] Project updated: ${event.projectId} (tenant: ${event.tenantId})`);
        // Could update local project cache or notify the UI
        break;
      }
      case 'project.deleted': {
        // Handle project deletion from Archii
        console.log(`[Archii Webhook] Project deleted: ${event.projectId} (tenant: ${event.tenantId})`);
        // Could unlink quotations from the deleted project
        if (event.projectId) {
          await db.quotation.updateMany({
            where: {
              archiiProjectId: event.projectId,
              archiiTenantId: event.tenantId,
            },
            data: {
              archiiProjectId: null,
            },
          });
        }
        break;
      }
      case 'tenant.config_changed': {
        // Handle tenant configuration change
        console.log(`[Archii Webhook] Tenant config changed: ${event.tenantId}`);
        break;
      }
      default:
        console.log(`[Archii Webhook] Unknown event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Archii webhook:', error);
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    );
  }
}
