import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Calendar,
  Tag,
  Paperclip,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useLogistics } from '../context/useLogistics';
import {
  getPendingExpenseApprovals,
  approveExpense,
  rejectExpense,
  getExpenseAttachments,
  getExpenseById,
  checkBudgetLimit,
  getAllBudgetSummaries,
} from '../services/expenseService';
import {
  PendingExpenseApproval,
  Transaction,
  ExpenseAttachment,
  ExpenseBudgetSummary,
} from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';

export default function ExpenseApprovals() {
  const { currentUser, selectedDepartmentId } = useLogistics();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'budgets'>('pending');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // Pending approvals
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpenseApproval[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<ExpenseAttachment[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Budget summaries
  const [budgetSummaries, setBudgetSummaries] = useState<ExpenseBudgetSummary[]>([]);

  // Approval form
  const [rejectionReason, setRejectionReason] = useState('');
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDepartmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingData, budgetData] = await Promise.all([
        getPendingExpenseApprovals(selectedDepartmentId || ''),
        getAllBudgetSummaries(selectedDepartmentId || ''),
      ]);

      setPendingExpenses(pendingData);
      setBudgetSummaries(budgetData);
    } catch (err) {
      setStatus({ type: 'error', message: `Error loading expense data: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (expense: PendingExpenseApproval) => {
    try {
      const fullExpense = await getExpenseById(expense.id);
      const attachments = await getExpenseAttachments(expense.id);

      setSelectedExpense(fullExpense);
      setSelectedAttachments(attachments);

      // Check budget impact
      if (fullExpense.costCenterId) {
        const budgetCheck = await checkBudgetLimit(fullExpense.costCenterId, fullExpense.amount);
        if (!budgetCheck.canApprove) {
          setBudgetWarning(budgetCheck.message);
        } else {
          setBudgetWarning(null);
        }
      }

      setShowDetailModal(true);
    } catch (err) {
      setStatus({ type: 'error', message: `Error loading expense details: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense || !currentUser) return;

    try {
      await approveExpense(selectedExpense.id, currentUser.id);
      setPendingExpenses(pendingExpenses.filter((e) => e.id !== selectedExpense.id));
      setShowDetailModal(false);
      setSelectedExpense(null);
      setRejectionReason('');
    } catch (err) {
      setStatus({ type: 'error', message: `Error approving expense: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const handleReject = async () => {
    if (!selectedExpense || !rejectionReason.trim()) {
      alert('Por favor, forneça uma razão para a rejeição');
      setStatus({ type: 'info', message: 'Por favor, forneça uma razão para a rejeição' });
      return;
    }

    try {
      await rejectExpense(selectedExpense.id, rejectionReason);
      setPendingExpenses(pendingExpenses.filter((e) => e.id !== selectedExpense.id));
      setShowDetailModal(false);
      setSelectedExpense(null);
      setRejectionReason('');
    } catch (err: any) {
      setStatus({ type: 'error', message: `Error rejecting expense: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'EXCEEDED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'CRITICAL':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
          <DollarSign className="w-10 h-10 text-blue-600" />
          Aprovação de Despesas
        </h1>
        <p className="text-slate-600 mt-2">
          Revise e aprove despesas pendentes | Monitorize orçamentos
        </p>
      </div>

      {/* STATUS MESSAGE */}
      {status && (
        <div className={`p-3 rounded text-sm mb-6 ${
          status.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
          status.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
          'bg-blue-50 border border-blue-100 text-blue-800'
        }`}>
          {status.message}
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-lg shadow-md mb-6">

      <div className="flex border-b border-slate-200">
          {(['pending', 'budgets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'pending' && `Pendentes (${pendingExpenses.length})`}
              {tab === 'budgets' && 'Orçamentos'}
            </button>
          ))}
        </div>

        {/* PENDING APPROVALS TAB */}
        {activeTab === 'pending' && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pendingExpenses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                <p>Todas as despesas foram aprovadas!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {pendingExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-4 bg-slate-50 rounded-lg border-l-4 border-orange-500 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-slate-600" />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {expense.receiptNumber || 'Recibo Sem Número'}
                            </p>
                            <p className="text-sm text-slate-600">{expense.userName}</p>
                          </div>
                        </div>

                        {expense.description && (
                          <p className="text-sm text-slate-700 ml-8 mb-2">{expense.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 ml-8 text-sm text-slate-600">
                          {expense.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {expense.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatFlexibleDate(expense.date)}
                          </span>
                          {expense.attachmentCount > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Paperclip className="w-4 h-4" />
                              {expense.attachmentCount} anexo{expense.attachmentCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 text-lg">
                            {expense.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'MZN',
                            })}
                          </p>
                          {expense.requiresApproval && (
                            <p className="text-xs text-red-600 font-semibold">
                              ⚠️ Requer Aprovação
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleViewDetails(expense)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Revisar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUDGETS TAB */}
        {activeTab === 'budgets' && (
          <div className="p-6">
            {budgetSummaries.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>Sem orçamentos configurados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetSummaries.map((budget) => (
                  <div
                    key={budget.costCenterId}
                    className={`p-4 rounded-lg border-2 ${getBudgetStatusColor(budget.budgetStatus)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">
                          {budget.costCenterName || 'Centro Sem Nome'}
                        </h3>
                        <p className="text-xs opacity-75">
                          {formatFlexibleDate(budget.periodStart)} a{' '}
                          {formatFlexibleDate(budget.periodEnd)}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-current bg-opacity-20">
                        {budget.budgetStatus}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Orçamento:</span>
                        <span className="font-semibold">
                          {budget.budgetAmount?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          }) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Gasto:</span>
                        <span className="font-semibold">
                          {budget.spentAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Restante:</span>
                        <span className="font-semibold">
                          {budget.remainingBudget.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          budget.budgetStatus === 'EXCEEDED'
                            ? 'bg-red-600'
                            : budget.budgetStatus === 'CRITICAL'
                              ? 'bg-orange-600'
                              : budget.budgetStatus === 'WARNING'
                                ? 'bg-yellow-600'
                                : 'bg-green-600'
                        }`}
                        style={{
                          width: `${Math.min(budget.percentageUsed, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs mt-2 font-semibold">
                      {budget.percentageUsed.toFixed(1)}% utilizado
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Detalhes da Despesa</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedExpense.receiptNumber || 'Recibo sem número'}
                </p>
              </div>
            </div>

            {/* MODAL CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* BUDGET WARNING */}
              {budgetWarning && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-red-800 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {budgetWarning}
                  </p>
                </div>
              )}

              {/* EXPENSE DETAILS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Solicitante</p>
                  <p className="font-semibold text-slate-900">{selectedExpense.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valor</p>
                  <p className="font-semibold text-lg text-blue-600">
                    {selectedExpense.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'MZN',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Data</p>
                  <p className="font-semibold text-slate-900">
                    {formatFlexibleDate(selectedExpense.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Categoria</p>
                  <p className="font-semibold text-slate-900">
                    {selectedExpense.category || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedExpense.description && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Descrição</p>
                  <p className="p-3 bg-slate-50 rounded text-slate-800">
                    {selectedExpense.description}
                  </p>
                </div>
              )}

              {/* ATTACHMENTS */}
              {selectedAttachments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    Documentos ({selectedAttachments.length})
                  </p>
                  <div className="space-y-2">
                    {selectedAttachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-blue-50 rounded border border-slate-200 transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {att.fileName}
                          </p>
                          <p className="text-xs text-slate-600">
                            {att.attachmentType} • {formatFlexibleDate(att.uploadedAt)}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* REJECTION REASON (if needed) */}
              {selectedExpense.approvalStatus === 'PENDING' && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    Razão da Rejeição (se aplicável)
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explique por que a despesa é rejeitada..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rejeitar
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedExpense(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-slate-300 text-slate-800 rounded-lg font-medium hover:bg-slate-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
