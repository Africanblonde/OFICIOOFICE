import { supabase } from './supabaseClient';
import {
  Transaction,
  ExpenseAttachment,
  ExpenseBudgetTracking,
  PendingExpenseApproval,
  ExpenseBudgetSummary,
  ExpenseByCategoryReport,
  ApprovalStatus,
  AttachmentType,
} from '../types';

/**
 * Serviço para gerenciar despesas, aprovações e orçamentos
 */

// ============= TRANSACTIONS / DESPESAS =============

export async function createExpense(expense: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  // Validar cost_center_id obrigatório
  if (!expense.costCenterId) {
    throw new Error('cost_center_id é obrigatório para despesas');
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([expense])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getExpenseById(expenseId: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', expenseId)
    .eq('type', 'EXPENSE')
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', expenseId)
    .eq('type', 'EXPENSE')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getExpensesByStatus(
  status: ApprovalStatus,
  locationId?: string,
  limit: number = 50
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('type', 'EXPENSE')
    .eq('approval_status', status);

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============= EXPENSE ATTACHMENTS =============

export async function uploadExpenseAttachment(
  expenseId: string,
  file: File,
  attachmentType: AttachmentType,
  description?: string
): Promise<ExpenseAttachment> {
  try {
    // Upload file to Supabase Storage
    const fileName = `${expenseId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('expense-receipts')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('expense-receipts')
      .getPublicUrl(fileName);

    // Create attachment record
    const { data, error } = await supabase
      .from('expense_attachments')
      .insert([
        {
          transaction_id: expenseId,
          attachment_type: attachmentType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          description,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error uploading expense attachment:', err);
    throw err;
  }
}

export async function getExpenseAttachments(expenseId: string): Promise<ExpenseAttachment[]> {
  const { data, error } = await supabase
    .from('expense_attachments')
    .select('*')
    .eq('transaction_id', expenseId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteExpenseAttachment(attachmentId: string): Promise<void> {
  const { error } = await supabase
    .from('expense_attachments')
    .delete()
    .eq('id', attachmentId);

  if (error) throw error;
}

// ============= EXPENSE APPROVALS =============

export async function getPendingExpenseApprovals(
  locationId?: string,
  limit: number = 50
): Promise<PendingExpenseApproval[]> {
  let query = supabase.from('v_pending_expense_approvals').select('*');

  if (locationId) {
    // Filter would be on cost_center's location_id if available
    // For now, we get all pending and filter client-side
  }

  const { data, error } = await query.limit(limit).order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function approveExpense(
  expenseId: string,
  approvedBy: string,
  notes?: string
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      approval_status: 'APPROVED',
      approved_by: approvedBy,
      approval_date: new Date().toISOString(),
      notes: notes,
      requires_approval: false,
    })
    .eq('id', expenseId)
    .eq('type', 'EXPENSE')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejectExpense(
  expenseId: string,
  rejectionReason: string
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      approval_status: 'REJECTED',
      rejection_reason: rejectionReason,
      requires_approval: false,
    })
    .eq('id', expenseId)
    .eq('type', 'EXPENSE')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markExpenseAsPaid(expenseId: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      approval_status: 'PAID',
    })
    .eq('id', expenseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============= BUDGET TRACKING & MONITORING =============

export async function getBudgetSummary(costCenterId: string): Promise<ExpenseBudgetSummary | null> {
  // Get current month's budget tracking
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('v_expense_budget_summary')
    .select('*')
    .eq('cost_center_id', costCenterId)
    .gte('period_start', monthStart)
    .lte('period_end', monthEnd)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

export async function getAllBudgetSummaries(
  locationId?: string
): Promise<ExpenseBudgetSummary[]> {
  let query = supabase.from('v_expense_budget_summary').select('*');

  // Current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data, error } = await query
    .gte('period_start', monthStart)
    .lte('period_end', monthEnd)
    .order('percentage_used', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function checkBudgetLimit(
  costCenterId: string,
  amount: number
): Promise<{ canApprove: boolean; message: string; percentageAfter: number }> {
  const summary = await getBudgetSummary(costCenterId);

  if (!summary || !summary.budgetAmount) {
    return {
      canApprove: true,
      message: 'Sem limite de orçamento definido',
      percentageAfter: 0,
    };
  }

  const newTotal = summary.spentAmount + amount;
  const newPercentage = (newTotal / summary.budgetAmount) * 100;

  return {
    canApprove: newTotal <= summary.budgetAmount,
    message:
      newPercentage > 100
        ? `Excede orçamento em ${(newPercentage - 100).toFixed(2)}%`
        : `Utilizaria ${newPercentage.toFixed(2)}% do orçamento`,
    percentageAfter: newPercentage,
  };
}

// ============= EXPENSE REPORTS =============

export async function getExpensesByCategory(
  costCenterId?: string
): Promise<ExpenseByCategoryReport[]> {
  let query = supabase.from('v_expenses_by_category').select('*');

  if (costCenterId) {
    query = query.eq('cost_center_id', costCenterId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getExpenseReport(
  startDate: string,
  endDate: string,
  costCenterId?: string,
  category?: string
): Promise<{
  totalExpenses: number;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  byCategory: Record<string, number>;
  byStatus: Record<ApprovalStatus, number>;
}> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('type', 'EXPENSE')
    .gte('date', startDate)
    .lte('date', endDate);

  if (costCenterId) {
    query = query.eq('cost_center_id', costCenterId);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw error;

  const report = {
    totalExpenses: data?.length || 0,
    totalApproved: 0,
    totalPending: 0,
    totalRejected: 0,
    byCategory: {} as Record<string, number>,
    byStatus: {
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      PAID: 0,
    } as Record<ApprovalStatus, number>,
  };

  data?.forEach((expense) => {
    // Count by status
    const status = expense.approval_status as ApprovalStatus;
    report.byStatus[status] = (report.byStatus[status] || 0) + 1;

    // Sum by category
    const cat = expense.category || 'Sem Categoria';
    report.byCategory[cat] = (report.byCategory[cat] || 0) + expense.amount;

    // Sum totals
    if (expense.approval_status === 'APPROVED') report.totalApproved += expense.amount;
    if (expense.approval_status === 'PENDING') report.totalPending += expense.amount;
    if (expense.approval_status === 'REJECTED') report.totalRejected += expense.amount;
  });

  return report;
}

// ============= EXPENSE VALIDATION =============

export async function validateExpenseSubmission(
  expense: Partial<Transaction>
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!expense.costCenterId) errors.push('Centro de custo é obrigatório');
  if (!expense.amount || expense.amount <= 0) errors.push('Valor deve ser maior que zero');
  if (!expense.category) warnings.push('Categoria não preenchida');
  if (!expense.description) warnings.push('Descrição não preenchida');

  // Check budget if provided
  if (expense.costCenterId && expense.amount) {
    const budgetCheck = await checkBudgetLimit(expense.costCenterId, expense.amount);
    if (!budgetCheck.canApprove) {
      errors.push(budgetCheck.message);
    }
  }

  // Check attachments if large amount
  if (expense.amount && expense.amount > 5000) {
    // Would check for attachments but cannot from this context
    warnings.push('Despesa > 5000 requer documentação de suporte');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============= COST CENTER MANAGEMENT =============

export async function getCostCenterById(costCenterId: string) {
  const { data, error } = await supabase
    .from('cost_centers')
    .select('*')
    .eq('id', costCenterId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllCostCenters(locationId?: string, activeOnly: boolean = true) {
  let query = supabase.from('cost_centers').select('*');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data || [];
}

export async function createCostCenter(costCenter: any) {
  const { data, error } = await supabase
    .from('cost_centers')
    .insert([costCenter])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCostCenter(costCenterId: string, updates: any) {
  const { data, error } = await supabase
    .from('cost_centers')
    .update(updates)
    .eq('id', costCenterId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
