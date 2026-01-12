import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  getInstallmentsForInvoice,
  createInstallmentPlan,
  payInstallment,
} from '../services/collectionsService';
import {
  InvoiceInstallment,
  Invoice,
  PaymentMethod,
} from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';

interface Props {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
  onInstallmentCreated?: () => void;
}

export default function InstallmentModal({
  invoice,
  open,
  onClose,
  onInstallmentCreated,
}: Props) {
  const [installments, setInstallments] = useState<InvoiceInstallment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);

  // Create Form state
  const [numInstallments, setNumInstallments] = useState(3);
  const [startDate, setStartDate] = useState('');

  // Payment Form state
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: PaymentMethod.BANK_TRANSFER,
    reference: '',
  });

  useEffect(() => {
    if (open) {
      loadInstallments();
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
    }
  }, [open, invoice.id]);

  const loadInstallments = async () => {
    try {
      setLoading(true);
      const data = await getInstallmentsForInvoice(invoice.id);
      setInstallments(data);
    } catch (err) {
      console.error('Error loading installments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceTotal = (): number => {
    return invoice.itens.reduce((sum, item) => {
      const itemTotal = item.quantidade * item.precoUnitario;
      const tax = item.impostoPercent ? itemTotal * (item.impostoPercent / 100) : 0;
      return sum + itemTotal + tax;
    }, 0);
  };

  const getTotalPaid = (): number => {
    return installments
      .filter((inst) => inst.status === 'PAID')
      .reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);
  };

  const getTotalPending = (): number => {
    return installments
      .filter((inst) => inst.status !== 'PAID')
      .reduce((sum, inst) => sum + inst.installmentAmount, 0);
  };

  const handleCreateInstallments = async () => {
    if (!startDate || numInstallments < 2) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    try {
      setLoading(true);
      const invoiceTotal = getInvoiceTotal();
      const created = await createInstallmentPlan(
        invoice.id,
        numInstallments,
        invoiceTotal,
        startDate
      );

      setInstallments(created);
      setShowCreateForm(false);
      onInstallmentCreated?.();
    } catch (err) {
      console.error('Error creating installment plan:', err);
      alert('Erro ao criar plano de parcelamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (installmentId: string) => {
    if (paymentData.amount <= 0) {
      alert('Por favor, insira um valor válido');
      return;
    }

    try {
      setLoading(true);
      const updated = await payInstallment(
        installmentId,
        paymentData.amount,
        paymentData.method,
        paymentData.reference
      );

      setInstallments(
        installments.map((inst) =>
          inst.id === installmentId ? updated : inst
        )
      );
      setShowPaymentForm(null);
      setPaymentData({
        amount: 0,
        method: PaymentMethod.BANK_TRANSFER,
        reference: '',
      });
    } catch (err) {
      console.error('Error paying installment:', err);
      alert('Erro ao registar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PARTIALLY_PAID':
        return 'bg-blue-100 text-blue-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PARTIALLY_PAID: 'Parcialmente Paga',
      PAID: 'Paga',
      OVERDUE: 'Atrasada',
      CANCELLED: 'Cancelada',
    };
    return labels[status] || status;
  };

  if (!open) return null;

  const invoiceTotal = getInvoiceTotal();
  const totalPaid = getTotalPaid();
  const totalPending = getTotalPending();
  const progressPercent = (totalPaid / invoiceTotal) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Parcelamentos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fatura: <span className="font-semibold">{invoice.numero}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Total da Fatura</p>
              <p className="text-2xl font-bold text-blue-900">
                {invoiceTotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'MZN',
                })}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 font-medium">Pago</p>
              <p className="text-2xl font-bold text-green-900">
                {totalPaid.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'MZN',
                })}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-600 font-medium">Pendente</p>
              <p className="text-2xl font-bold text-orange-900">
                {totalPending.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'MZN',
                })}
              </p>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Progresso de Pagamento</p>
              <p className="text-sm font-semibold text-gray-900">{progressPercent.toFixed(0)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* CREATE INSTALLMENT FORM */}
          {showCreateForm && installments.length === 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Criar Novo Plano de Parcelamento
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Number of Installments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Parcelas
                  </label>
                  <select
                    value={numInstallments}
                    onChange={(e) => setNumInstallments(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {[2, 3, 4, 5, 6, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Primeira Parcela
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-100 rounded text-sm text-blue-800">
                <p className="font-semibold mb-1">Resumo:</p>
                <p>
                  {numInstallments} parcelas de{' '}
                  {(invoiceTotal / numInstallments).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'MZN',
                  })}{' '}
                  cada
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateInstallments}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Plano'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* INSTALLMENTS LIST */}
          {installments.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Plano de Parcelamento</h3>
              {installments.map((installment, index) => (
                <div
                  key={installment.id}
                  className={`p-4 rounded-lg border-l-4 transition-colors ${
                    installment.status === 'PAID'
                      ? 'bg-green-50 border-l-green-500'
                      : installment.daysOverdue > 0
                        ? 'bg-red-50 border-l-red-500'
                        : 'bg-gray-50 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Parcela {installment.installmentNumber}/{installment.totalInstallments}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vencimento: {formatFlexibleDate(installment.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {installment.installmentAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </p>
                        {installment.paidAmount && (
                          <p className="text-sm text-green-600">
                            Pago:{' '}
                            {installment.paidAmount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'MZN',
                            })}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(installment.status)}`}>
                        {getStatusLabel(installment.status)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Form for this installment */}
                  {showPaymentForm === installment.id && installment.status !== 'PAID' && (
                    <div className="mt-3 pt-3 border-t border-gray-300 space-y-3 bg-white rounded p-3">
                      <h4 className="font-semibold text-sm text-gray-900">Registar Pagamento</h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Valor
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              type="number"
                              step="0.01"
                              value={paymentData.amount}
                              onChange={(e) =>
                                setPaymentData({
                                  ...paymentData,
                                  amount: parseFloat(e.target.value),
                                })
                              }
                              placeholder="0.00"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Método
                          </label>
                          <select
                            value={paymentData.method}
                            onChange={(e) =>
                              setPaymentData({
                                ...paymentData,
                                method: e.target.value as PaymentMethod,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="CASH">Dinheiro</option>
                            <option value="CARD">Cartão</option>
                            <option value="BANK_TRANSFER">Transferência</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Referência (Opcional)
                        </label>
                        <input
                          type="text"
                          value={paymentData.reference}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              reference: e.target.value,
                            })
                          }
                          placeholder="Ex: Ref. bancária, Nº cheque..."
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePayInstallment(installment.id)}
                          disabled={loading}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Registando...' : 'Confirmar Pagamento'}
                        </button>
                        <button
                          onClick={() => setShowPaymentForm(null)}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment button if not paid */}
                  {installment.status !== 'PAID' && showPaymentForm !== installment.id && (
                    <button
                      onClick={() => {
                        setPaymentData({
                          ...paymentData,
                          amount: installment.installmentAmount - (installment.paidAmount || 0),
                        });
                        setShowPaymentForm(installment.id);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
                    >
                      + Registar Pagamento
                    </button>
                  )}

                  {/* Days overdue warning */}
                  {installment.daysOverdue > 0 && installment.status !== 'PAID' && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {installment.daysOverdue} dias de atraso
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !showCreateForm && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Nenhum plano de parcelamento criado</p>
              </div>
            )
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {installments.length > 0
              ? `${installments.filter((i) => i.status === 'PAID').length}/${installments.length} parcelas pagas`
              : 'Fatura não parcelada'}
          </div>
          <div className="flex gap-2">
            {installments.length === 0 && !showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Parcelamento
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
