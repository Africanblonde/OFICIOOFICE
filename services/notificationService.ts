/**
 * Serviço de Notificações para Cobranças
 * Suporta envio de emails, SMS e registar tentativas de contacto
 */

import { supabase } from './supabaseClient';
import { createCollectionAttempt } from './collectionsService';
import { CollectionAttemptType, CollectionAttemptStatus } from '../types';

// ============= EMAIL SERVICE =============

export interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  clientName?: string;
  invoiceNumber?: string;
}

/**
 * Envia email de cobrança via Edge Function
 */
export async function sendCollectionEmail(
  email: string,
  clientName: string,
  invoiceNumber: string,
  invoiceAmount: number,
  dueDate: string,
  daysOverdue: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Call Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-collection-email', {
      body: {
        to: email,
        clientName,
        invoiceNumber,
        invoiceAmount,
        dueDate,
        daysOverdue,
      },
    });

    if (error) throw error;

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (err) {
    console.error('Error sending collection email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ============= SMS SERVICE =============

/**
 * Envia SMS de cobrança via Edge Function ou provider (ex: Twilio, Vonage)
 */
export async function sendCollectionSMS(
  phoneNumber: string,
  clientName: string,
  invoiceNumber: string,
  invoiceAmount: number,
  dueDate: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-collection-sms', {
      body: {
        to: phoneNumber,
        clientName,
        invoiceNumber,
        invoiceAmount,
        dueDate,
      },
    });

    if (error) throw error;

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (err) {
    console.error('Error sending collection SMS:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ============= COLLECTION ALERT SERVICE =============

export interface CollectionAlertOptions {
  invoiceId: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  invoiceNumber: string;
  invoiceAmount: number;
  dueDate: string;
  daysOverdue: number;
  createdBy?: string;
}

/**
 * Envia alertas de cobrança e registra tentativas
 */
export async function sendCollectionAlert(
  options: CollectionAlertOptions,
  preferredMethods: CollectionAttemptType[] = [CollectionAttemptType.EMAIL, CollectionAttemptType.SMS]
): Promise<{
  success: boolean;
  attempts: Array<{ method: CollectionAttemptType; success: boolean }>;
  errors: string[];
}> {
  const attempts: Array<{ method: CollectionAttemptType; success: boolean }> = [];
  const errors: string[] = [];

  // Email attempt
  if (preferredMethods.includes(CollectionAttemptType.EMAIL) && options.clientEmail) {
    try {
      const result = await sendCollectionEmail(
        options.clientEmail,
        options.clientName,
        options.invoiceNumber,
        options.invoiceAmount,
        options.dueDate,
        options.daysOverdue
      );

      attempts.push({
        method: CollectionAttemptType.EMAIL,
        success: result.success,
      });

      // Register collection attempt
      if (result.success) {
        await createCollectionAttempt({
          invoiceId: options.invoiceId,
          clientId: options.clientId,
          attemptType: CollectionAttemptType.EMAIL,
          attemptStatus: CollectionAttemptStatus.SENT,
          attemptDate: new Date().toISOString(),
          responseReceived: false,
          notes: `Recordatório automático enviado para ${options.clientEmail}`,
          createdBy: options.createdBy,
        });
      }

      if (!result.success) {
        errors.push(`Email failure: ${result.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Email error: ${errMsg}`);
      attempts.push({ method: CollectionAttemptType.EMAIL, success: false });
    }
  }

  // SMS attempt
  if (preferredMethods.includes(CollectionAttemptType.SMS) && options.clientPhone) {
    try {
      const result = await sendCollectionSMS(
        options.clientPhone,
        options.clientName,
        options.invoiceNumber,
        options.invoiceAmount,
        options.dueDate
      );

      attempts.push({
        method: CollectionAttemptType.SMS,
        success: result.success,
      });

      // Register collection attempt
      if (result.success) {
        await createCollectionAttempt({
          invoiceId: options.invoiceId,
          clientId: options.clientId,
          attemptType: CollectionAttemptType.SMS,
          attemptStatus: CollectionAttemptStatus.SENT,
          attemptDate: new Date().toISOString(),
          responseReceived: false,
          notes: `Recordatório automático enviado para ${options.clientPhone}`,
          createdBy: options.createdBy,
        });
      }

      if (!result.success) {
        errors.push(`SMS failure: ${result.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`SMS error: ${errMsg}`);
      attempts.push({ method: CollectionAttemptType.SMS, success: false });
    }
  }

  return {
    success: errors.length === 0 && attempts.length > 0,
    attempts,
    errors,
  };
}

// ============= SCHEDULED ALERTS =============

/**
 * Prepara alertas automáticos baseados em regras
 * Esta função seria chamada periodicamente (ex: daily cron job)
 */
export async function processScheduledCollectionAlerts() {
  try {
    // Get all overdue invoices that need reminders
    const { data: invoices, error } = await supabase
      .from('v_overdue_invoices')
      .select('*, clients(id, name, email, contact)')
      .gte('days_overdue', 1);

    if (error) throw error;

    if (!invoices || invoices.length === 0) {
      return { processed: 0, successful: 0, failed: 0 };
    }

    let successful = 0;
    let failed = 0;

    // Process each overdue invoice
    for (const invoice of invoices) {
      try {
        // Send alert only if no attempt in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentAttempts } = await supabase
          .from('collection_attempts')
          .select('id')
          .eq('invoice_id', invoice.id)
          .gte('attempt_date', sevenDaysAgo.toISOString())
          .limit(1);

        if (recentAttempts && recentAttempts.length > 0) {
          // Skip - already attempted recently
          continue;
        }

        // Determine preferred method based on days overdue
        const preferredMethods: CollectionAttemptType[] = [CollectionAttemptType.EMAIL];
        if (invoice.days_overdue > 30) {
          preferredMethods.push(CollectionAttemptType.SMS);
        }

        // Send alert
        const result = await sendCollectionAlert({
          invoiceId: invoice.id,
          clientId: invoice.client_id,
          clientName: invoice.cliente_nome || invoice.clients?.name || 'Cliente',
          clientEmail: invoice.clients?.email,
          clientPhone: invoice.clients?.contact,
          invoiceNumber: invoice.numero,
          invoiceAmount: invoice.valor_total,
          dueDate: invoice.due_date,
          daysOverdue: invoice.days_overdue,
        }, preferredMethods);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Error processing invoice ${invoice.id}:`, err);
        failed++;
      }
    }

    return {
      processed: invoices.length,
      successful,
      failed,
    };
  } catch (err) {
    console.error('Error processing scheduled collection alerts:', err);
    throw err;
  }
}

// ============= ESCALATION ALERTS =============

/**
 * Envia alertas de escalação para faturas severamente atrasadas
 */
export async function sendEscalationAlert(
  invoiceId: string,
  clientId?: string,
  clientName?: string,
  clientEmail?: string,
  escalationLevel: 'WARNING' | 'URGENT' | 'CRITICAL' = 'WARNING'
) {
  const escalationMessages: Record<string, string> = {
    WARNING: 'sua fatura está com atraso',
    URGENT: 'sua fatura requer atenção imediata',
    CRITICAL: 'sua fatura foi encaminhada para procedimentos legais',
  };

  try {
    const { data, error } = await supabase.functions.invoke('send-escalation-alert', {
      body: {
        to: clientEmail,
        clientName,
        invoiceId,
        escalationLevel,
        message: escalationMessages[escalationLevel],
      },
    });

    if (error) throw error;

    // Register escalation attempt
    await createCollectionAttempt({
      invoiceId,
      clientId,
      attemptType: CollectionAttemptType.EMAIL,
      attemptStatus: CollectionAttemptStatus.SENT,
      attemptDate: new Date().toISOString(),
      responseReceived: false,
      notes: `Alerta de escalação nível ${escalationLevel} enviado`,
    });

    return { success: true };
  } catch (err) {
    console.error('Error sending escalation alert:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
