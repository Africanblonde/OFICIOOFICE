import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  ChevronRight,
  Filter,
  Download,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { useLogistics } from '../context/useLogistics';
import {
  getClientsWithHighOverdue,
  getInvoicesNeedingCollection,
  getCollectionsStats,
  getOverdueInstallments,
  getAllClientBalances,
} from '../services/collectionsService';
import {
  ClientBalance,
  OverdueInvoice,
  InvoiceInstallment,
} from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';

export default function ContasAReceber() {
  const { invoices, selectedDepartmentId } = useLogistics();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clientes' | 'faturas' | 'parcelamentos'>(
    'overview'
  );
  const [filter, setFilter] = useState<'all' | '30' | '60' | '90'>('all');

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [clientsOverdue, setClientsOverdue] = useState<ClientBalance[]>([]);
  const [invoicesOverdue, setInvoicesOverdue] = useState<OverdueInvoice[]>([]);
  const [allClientBalances, setAllClientBalances] = useState<ClientBalance[]>([]);
  const [overdueInstallments, setOverdueInstallments] = useState<InvoiceInstallment[]>([]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [selectedDepartmentId, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, clientsData, invoicesData, balancesData, installmentsData] =
        await Promise.all([
          getCollectionsStats(selectedDepartmentId || ''),
          getClientsWithHighOverdue(parseInt(filter === 'all' ? '1' : filter)),
          getInvoicesNeedingCollection(selectedDepartmentId || '', 1),
          getAllClientBalances(),
          getOverdueInstallments(1),
        ]);

      setStats(statsData);
      setClientsOverdue(clientsData);
      setInvoicesOverdue(invoicesData as unknown as OverdueInvoice[]);
      setAllClientBalances(balancesData);
      setOverdueInstallments(installmentsData);
    } catch (err) {
      console.error('Error loading collections data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'DUE' || status === 'DUE_LETTER') return 'bg-yellow-50 text-yellow-800';
    if (status.includes('OVERDUE_30')) return 'bg-orange-50 text-orange-800';
    if (status.includes('OVERDUE_60')) return 'bg-red-50 text-red-800';
    if (status.includes('OVERDUE_90')) return 'bg-red-100 text-red-900';
    return 'bg-gray-50 text-gray-800';
  };

  const getStatusBadge = (daysOverdue: number) => {
    if (daysOverdue <= 0) return { label: 'Não Vencida', color: 'bg-green-100 text-green-800' };
    if (daysOverdue <= 30) return { label: 'Vencida', color: 'bg-yellow-100 text-yellow-800' };
    if (daysOverdue <= 60) return { label: 'Atraso 30+ dias', color: 'bg-orange-100 text-orange-800' };
    if (daysOverdue <= 90) return { label: 'Atraso 60+ dias', color: 'bg-red-100 text-red-800' };
    return { label: 'Atraso 90+ dias', color: 'bg-red-200 text-red-900' };
  };

  if (loading) {
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
          Contas a Receber
        </h1>
        <p className="text-slate-600 mt-2">
          Dashboard de cobranças, atrasos e parcelamentos
        </p>
      </div>

      {/* KPI CARDS */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Overdue */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Faturas Atrasadas</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalOverdue}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </div>

          {/* Amount Overdue */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Montante Atrasado</p>
                <p className="text-3xl font-bold text-slate-900">
                  {(stats.totalOverdueAmount / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </div>

          {/* Average Days Overdue */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Dias Médios de Atraso</p>
                <p className="text-3xl font-bold text-slate-900">{stats.averageDaysOverdue}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
            </div>
          </div>

          {/* Clients with Overdue */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Clientes c/ Atraso</p>
                <p className="text-3xl font-bold text-slate-900">{clientsOverdue.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-slate-200">
          {(['overview', 'clientes', 'faturas', 'parcelamentos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'overview' && 'Visão Geral'}
              {tab === 'clientes' && 'Clientes'}
              {tab === 'faturas' && 'Faturas'}
              {tab === 'parcelamentos' && 'Parcelamentos'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded p-4 border-l-4 border-blue-500">
                    <p className="text-xs text-slate-600">Vencidas</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.byStatus.due}</p>
                  </div>
                  <div className="bg-yellow-50 rounded p-4 border-l-4 border-yellow-500">
                    <p className="text-xs text-slate-600">30+ dias</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.overdue30}</p>
                  </div>
                  <div className="bg-orange-50 rounded p-4 border-l-4 border-orange-500">
                    <p className="text-xs text-slate-600">60+ dias</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.byStatus.overdue60}</p>
                  </div>
                  <div className="bg-red-50 rounded p-4 border-l-4 border-red-500">
                    <p className="text-xs text-slate-600">90+ dias</p>
                    <p className="text-2xl font-bold text-red-600">{stats.byStatus.overdue90}</p>
                  </div>
                </div>
              )}

              {/* Top Clients Requiring Collection */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Clientes Prioritários para Cobrança
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clientsOverdue.slice(0, 10).map((client) => (
                    <div
                      key={client.clientId}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{client.clientName}</p>
                        <p className="text-sm text-slate-600">NUIT: {client.nuit || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          {client.overdueAmount?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </p>
                        <p className="text-sm text-slate-600">
                          {client.maxDaysOverdue} dias de atraso
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CLIENTES TAB */}
          {activeTab === 'clientes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex gap-2">
                  {['all', '30', '60', '90'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        filter === f
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {f === 'all' ? 'Todos' : `${f}+ dias`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-900">Cliente</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-900">
                        Saldo Pendente
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-900">
                        Montante Atrasado
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-900">
                        Dias Atraso
                      </th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-900">
                        Faturas
                      </th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allClientBalances.map((client) => (
                      <tr
                        key={client.clientId}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">{client.clientName}</p>
                            <p className="text-xs text-slate-600">{client.nuit}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {client.outstandingAmount?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              client.overdueAmount && client.overdueAmount > 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {client.overdueAmount?.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'MZN',
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                              client.maxDaysOverdue > 90
                                ? 'bg-red-100 text-red-800'
                                : client.maxDaysOverdue > 60
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {client.maxDaysOverdue}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{client.overdueInvoiceCount}</td>
                        <td className="px-4 py-3 text-center flex gap-2 justify-center">
                          <button
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                            title="Enviar Email"
                          >
                            <Mail className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                            title="Agendar Chamada"
                          >
                            <Phone className="w-4 h-4 text-green-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FATURAS TAB */}
          {activeTab === 'faturas' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {invoicesOverdue.map((invoice) => {
                const badge = getStatusBadge(invoice.daysOverdue);
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border-l-4 border-red-500"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="font-semibold text-slate-900">Fatura {invoice.numero}</p>
                          <p className="text-sm text-slate-600">{invoice.clientName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          {invoice.valorTotal?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </p>
                        <p className="text-sm text-slate-600">
                          Venceu em {formatFlexibleDate(invoice.dueDate)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PARCELAMENTOS TAB */}
          {activeTab === 'parcelamentos' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {overdueInstallments.length > 0 ? (
                overdueInstallments.map((installment) => (
                  <div
                    key={installment.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border-l-4 border-orange-500"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            Parcela {installment.installmentNumber}/{installment.totalInstallments}
                          </p>
                          <p className="text-sm text-slate-600">
                            Vencimento: {formatFlexibleDate(installment.dueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">
                          {installment.installmentAmount?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </p>
                        <p className="text-sm text-slate-600">
                          Atraso: {installment.daysOverdue} dias
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        {installment.status}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nenhum parcelamento com atraso
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER WITH ACTIONS */}
      <div className="flex gap-4 justify-end">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300 transition-colors font-medium">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">
          <Mail className="w-4 h-4" />
          Enviar Recordatórios
        </button>
      </div>
    </div>
  );
}
