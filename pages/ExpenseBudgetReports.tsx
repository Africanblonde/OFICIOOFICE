import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  Download,
  Filter,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
} from 'lucide-react';
import { useLogistics } from '../context/useLogistics';
import {
  getExpenseReport,
  getBudgetSummary,
  getExpensesByCategory,
  getAllBudgetSummaries,
  getAllCostCenters,
} from '../services/expenseService';
import {
  ExpenseBudgetSummary,
  ExpenseByCategoryReport,
  CostCenter,
} from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';

interface ReportFilters {
  startDate: string;
  endDate: string;
  costCenterId?: string;
  category?: string;
}

export default function ExpenseBudgetReports() {
  const { currentUser, selectedDepartmentId } = useLogistics();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analysis'>('overview');

  // Data
  const [budgetSummaries, setBudgetSummaries] = useState<ExpenseBudgetSummary[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<ExpenseByCategoryReport[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  // Filters
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: monthStart.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    costCenterId: undefined,
  });

  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalApprovalPending, setTotalApprovalPending] = useState(0);

  useEffect(() => {
    loadData();
  }, [filters, selectedDepartmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [summaries, categoryData, centers] = await Promise.all([
        getAllBudgetSummaries(selectedDepartmentId || ''),
        getExpensesByCategory(),
        getAllCostCenters(selectedDepartmentId || ''),
      ]);

      setBudgetSummaries(summaries);
      setCategoryBreakdown(categoryData);
      setCostCenters(centers);

      // Calculate totals
      const budgetTotal = summaries.reduce((acc, s) => acc + (s.budgetAmount || 0), 0);
      const spentTotal = summaries.reduce((acc, s) => acc + s.spentAmount, 0);
      const pendingTotal = summaries.reduce(
        (acc, s) => acc + (s.approvalPendingAmount || 0),
        0
      );

      setTotalBudget(budgetTotal);
      setTotalSpent(spentTotal);
      setTotalApprovalPending(pendingTotal);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        const csvContent = generateCSV();
        downloadFile(csvContent, 'expenses-report.csv', 'text/csv');
      } else if (format === 'pdf') {
        // TODO: Implement PDF export (requires jsPDF or similar)
        alert('Exportação em PDF em desenvolvimento');
      }
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  const generateCSV = (): string => {
    const headers = ['Centro de Custo', 'Orçamento', 'Gasto', 'Pendente', 'Restante', 'Status', '% Utilizado'];
    const rows = budgetSummaries.map((budget) => [
      budget.costCenterName || 'N/A',
      budget.budgetAmount?.toFixed(2) || '0',
      budget.spentAmount.toFixed(2),
      budget.approvalPendingAmount?.toFixed(2) || '0',
      budget.remainingBudget.toFixed(2),
      budget.budgetStatus,
      budget.percentageUsed.toFixed(1),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
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

  const getBudgetStatusBg = (status: string) => {
    switch (status) {
      case 'EXCEEDED':
        return 'bg-red-600';
      case 'CRITICAL':
        return 'bg-orange-600';
      case 'WARNING':
        return 'bg-yellow-600';
      default:
        return 'bg-green-600';
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
          <BarChart3 className="w-10 h-10 text-purple-600" />
          Relatórios de Orçamento
        </h1>
        <p className="text-slate-600 mt-2">
          Monitore gastos vs orçamento | Análise por categoria
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Centro de Custo
            </label>
            <select
              value={filters.costCenterId || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  costCenterId: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="">Todos</option>
              {costCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadData}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Atualizar
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-slate-600 mb-1">Orçamento Total</p>
            <p className="text-3xl font-bold text-slate-900">
              {totalBudget.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'MZN',
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <p className="text-sm text-slate-600 mb-1">Gasto Realizado</p>
            <p className="text-3xl font-bold text-slate-900">
              {totalSpent.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'MZN',
              })}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {totalBudget > 0
                ? ((totalSpent / totalBudget) * 100).toFixed(1)
                : '0'}
              % do orçamento
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-slate-600 mb-1">Pendente Aprovação</p>
            <p className="text-3xl font-bold text-slate-900">
              {totalApprovalPending.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'MZN',
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-slate-600 mb-1">Restante</p>
            <p className="text-3xl font-bold text-slate-900">
              {(totalBudget - totalSpent - totalApprovalPending).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'MZN',
              })}
            </p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex border-b border-slate-200">
          {(['overview', 'details', 'analysis'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'overview' && (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Visão Geral
                </>
              )}
              {tab === 'details' && (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Detalhes
                </>
              )}
              {tab === 'analysis' && (
                <>
                  <PieChart className="w-4 h-4" />
                  Análise
                </>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : activeTab === 'overview' ? (
            /* OVERVIEW TAB */
            <div className="space-y-6">
              {budgetSummaries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>Sem dados de orçamento para o período selecionado</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {budgetSummaries.map((budget) => (
                    <div
                      key={budget.costCenterId}
                      className={`p-4 rounded-lg border-2 ${getBudgetStatusColor(budget.budgetStatus)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {budget.costCenterName || 'Centro Sem Nome'}
                          </h3>
                          <p className="text-xs opacity-75 mt-1">
                            {formatFlexibleDate(budget.periodStart)} a{' '}
                            {formatFlexibleDate(budget.periodEnd)}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded bg-current bg-opacity-20 uppercase">
                          {budget.budgetStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
                        <div>
                          <p className="text-xs opacity-75">Orçamento</p>
                          <p className="font-semibold">
                            {budget.budgetAmount?.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'MZN',
                            }) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Gasto</p>
                          <p className="font-semibold">
                            {budget.spentAmount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'MZN',
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Pendente</p>
                          <p className="font-semibold">
                            {budget.approvalPendingAmount?.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'MZN',
                            }) || '0,00 MZN'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Restante</p>
                          <p className="font-semibold">
                            {budget.remainingBudget.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'MZN',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all ${getBudgetStatusBg(
                            budget.budgetStatus
                          )}`}
                          style={{
                            width: `${Math.min(budget.percentageUsed, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs mt-2 font-semibold opacity-75">
                        {budget.percentageUsed.toFixed(1)}% utilizado
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'details' ? (
            /* DETAILS TAB */
            <div className="overflow-x-auto">
              {budgetSummaries.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>Sem dados para exibir</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        Centro de Custo
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900">
                        Orçamento
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900">
                        Gasto
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900">
                        Pendente
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900">
                        Restante
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900">
                        % Utilizado
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetSummaries.map((budget) => (
                      <tr
                        key={budget.costCenterId}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {budget.costCenterName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800">
                          {budget.budgetAmount?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          }) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800">
                          {budget.spentAmount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800">
                          {budget.approvalPendingAmount?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          }) || '0,00 MZN'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800">
                          {budget.remainingBudget.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {budget.percentageUsed.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded uppercase ${getBudgetStatusColor(
                              budget.budgetStatus
                            )}`}
                          >
                            {budget.budgetStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* ANALYSIS TAB */
            <div className="space-y-6">
              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>Sem dados de categoria para o período selecionado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category breakdown list */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Gastos por Categoria
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {categoryBreakdown.map((category, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {category.categoryName || category.category || 'Sem Categoria'}
                            </p>
                            <p className="text-xs text-slate-600">
                              {category.expenseCount} despesa{category.expenseCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {category.totalAmount.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'MZN',
                              })}
                            </p>
                            <p className="text-xs text-slate-600">
                              {category.percentageOfTotal.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Resumo de Gastos
                    </h3>
                    <div className="space-y-3">
                      {categoryBreakdown.reduce(
                        (acc, cat) => ({
                          totalExpenses: acc.totalExpenses + cat.totalAmount,
                          count: acc.count + cat.expenseCount,
                        }),
                        { totalExpenses: 0, count: 0 }
                      ).totalExpenses > 0 && (
                        <>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">Total de Gastos</p>
                            <p className="text-xl font-bold text-blue-900">
                              {categoryBreakdown.reduce((acc, cat) => acc + cat.totalAmount, 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'MZN',
                              })}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-600 mb-1">Total de Despesas</p>
                            <p className="text-xl font-bold text-green-900">
                              {categoryBreakdown.reduce((acc, cat) => acc + cat.expenseCount, 0)}
                            </p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-xs text-purple-600 mb-1">Gasto Médio</p>
                            <p className="text-xl font-bold text-purple-900">
                              {(
                                categoryBreakdown.reduce((acc, cat) => acc + cat.totalAmount, 0) /
                                categoryBreakdown.reduce((acc, cat) => acc + cat.expenseCount, 1)
                              ).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'MZN',
                              })}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
