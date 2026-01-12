import { supabase } from './supabaseClient';
import {
  CollectionAttempt,
  InvoiceInstallment,
  ClientBalance,
  OverdueInvoice,
  CollectionAttemptType,
  CollectionAttemptStatus,
  Invoice,
} from '../types';

/**
 * Serviço para gerenciar cobranças, atrasos e parcelamentos
 */

// ============= COLLECTION ATTEMPTS (Tentativas de Cobrança) =============

export async function createCollectionAttempt(
  attempt: Omit<CollectionAttempt, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CollectionAttempt> {
  const { data, error } = await supabase
    .from('collection_attempts')
    .insert([attempt])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCollectionAttemptsForInvoice(
  invoiceId: string
): Promise<CollectionAttempt[]> {
  const { data, error } = await supabase
    .from('collection_attempts')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('attempt_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateCollectionAttempt(
  id: string,
  updates: Partial<CollectionAttempt>
): Promise<CollectionAttempt> {
  const { data, error } = await supabase
    .from('collection_attempts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOverdueInvoicesByClient(
  clientId: string,
  minDaysOverdue: number = 0
): Promise<OverdueInvoice[]> {
  const { data, error } = await supabase
    .from('v_overdue_invoices')
    .select('*')
    .eq('client_id', clientId)
    .gte('days_overdue', minDaysOverdue)
    .order('days_overdue', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============= INVOICE INSTALLMENTS (Parcelamentos) =============

export async function createInstallmentPlan(
  invoiceId: string,
  totalInstallments: number,
  invoiceAmount: number,
  startDate: string // ISO date for first installment
): Promise<InvoiceInstallment[]> {
  const installmentAmount = invoiceAmount / totalInstallments;
  const installments: Omit<InvoiceInstallment, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  const startDateObj = new Date(startDate);

  for (let i = 1; i <= totalInstallments; i++) {
    const dueDate = new Date(startDateObj);
    dueDate.setMonth(dueDate.getMonth() + i); // Add months progressively

    installments.push({
      invoiceId,
      installmentNumber: i,
      totalInstallments,
      installmentAmount: parseFloat(installmentAmount.toFixed(2)),
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'PENDING',
      daysOverdue: 0,
    });
  }

  const { data, error } = await supabase
    .from('invoice_installments')
    .insert(installments)
    .select();

  if (error) throw error;
  return data || [];
}

export async function getInstallmentsForInvoice(
  invoiceId: string
): Promise<InvoiceInstallment[]> {
  const { data, error } = await supabase
    .from('invoice_installments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('installment_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function payInstallment(
  installmentId: string,
  paidAmount: number,
  paymentMethod: string,
  paymentReference?: string
): Promise<InvoiceInstallment> {
  const paidDate = new Date().toISOString().split('T')[0]; // ISO date format

  const { data, error } = await supabase
    .from('invoice_installments')
    .update({
      paid_date: paidDate,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      status: paidAmount >= 0 ? 'PAID' : 'PARTIALLY_PAID', // Simplified logic
    })
    .eq('id', installmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOverdueInstallments(
  minDaysOverdue: number = 1
): Promise<InvoiceInstallment[]> {
  const { data, error } = await supabase
    .from('v_overdue_installments')
    .select('*')
    .gte('days_overdue', minDaysOverdue)
    .order('days_overdue', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============= CLIENT BALANCES =============

export async function getClientBalance(clientId: string): Promise<ClientBalance | null> {
  const { data, error } = await supabase
    .from('v_client_balances')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data || null;
}

export async function getAllClientBalances(
  minOverdueAmount?: number
): Promise<ClientBalance[]> {
  let query = supabase.from('v_client_balances').select('*');

  if (minOverdueAmount) {
    query = query.gte('overdue_amount', minOverdueAmount);
  }

  const { data, error } = await query.order('overdue_amount', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getClientsWithHighOverdue(
  minDaysOverdue: number = 30,
  limit: number = 50
): Promise<ClientBalance[]> {
  const { data, error } = await supabase
    .from('v_client_balances')
    .select('*')
    .gte('max_days_overdue', minDaysOverdue)
    .gte('overdue_invoice_count', 1)
    .order('max_days_overdue', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============= BALANCE HISTORY =============

export async function recordClientBalanceHistory(
  clientId: string,
  balanceAmount: number,
  overdueAmount: number,
  daysOldestOverdue: number,
  notes?: string
) {
  const { data, error } = await supabase
    .from('client_balance_history')
    .insert([
      {
        client_id: clientId,
        balance_amount: balanceAmount,
        overdue_amount: overdueAmount,
        days_oldest_overdue: daysOldestOverdue,
        notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClientBalanceHistory(
  clientId: string,
  days: number = 90
): Promise<any[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('client_balance_history')
    .select('*')
    .eq('client_id', clientId)
    .gte('recorded_date', startDate.toISOString())
    .order('recorded_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============= INVOICE COLLECTIONS FIELDS =============

export async function updateInvoiceCollectionFields(
  invoiceId: string,
  collectionStatus: string,
  daysOverdue: number,
  collectionNotes?: string
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update({
      collection_status: collectionStatus,
      days_overdue: daysOverdue,
      collection_notes: collectionNotes,
      last_collection_attempt: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInvoicesNeedingCollection(
  locationId?: string,
  minDaysOverdue: number = 1
): Promise<Invoice[]> {
  let query = supabase
    .from('v_overdue_invoices')
    .select('*')
    .gte('days_overdue', minDaysOverdue);

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query.order('days_overdue', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============= STATISTICS & REPORTS =============

export async function getCollectionsStats(locationId?: string) {
  let query = supabase.from('v_overdue_invoices').select('*');

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats = {
    totalOverdue: data?.length || 0,
    totalOverdueAmount: 0,
    byStatus: {
      due: 0,
      overdue30: 0,
      overdue60: 0,
      overdue90: 0,
    },
    averageDaysOverdue: 0,
  };

  if (data && data.length > 0) {
    stats.totalOverdueAmount = data.reduce((sum, inv) => sum + (inv.valor_total || 0), 0);
    stats.averageDaysOverdue = Math.round(
      data.reduce((sum, inv) => sum + (inv.days_overdue || 0), 0) / data.length
    );

    data.forEach((inv) => {
      if (inv.collection_status === 'DUE') stats.byStatus.due++;
      else if (inv.collection_status === 'OVERDUE_30') stats.byStatus.overdue30++;
      else if (inv.collection_status === 'OVERDUE_60') stats.byStatus.overdue60++;
      else if (inv.collection_status === 'OVERDUE_90') stats.byStatus.overdue90++;
    });
  }

  return stats;
}
