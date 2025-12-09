
import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/useLogistics';
import { Role, AttendanceStatus, TransactionType, ItemType } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, ShieldCheck, Activity, MapPin, ClipboardCheck, Package, Truck, ArrowRight,
  FileText, X, Printer, DollarSign, AlertTriangle, Users, Calendar
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const {
    inventory, requisitions, items, locations, currentUser, selectedDepartmentId, isAdminOrGM,
    transactions, accountingEntries, performanceRecords, allUsers, getItemName, getLocationName,
    hasPermission // Import hasPermission
  } = useLogistics();

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const effectiveLocationId = selectedDepartmentId
    ? selectedDepartmentId
    : (isAdminOrGM ? null : currentUser?.locationId);

  const getRelevantLocations = () => {
    if (!effectiveLocationId) return locations;
    return locations.filter(l => l.id === effectiveLocationId || l.parentId === effectiveLocationId);
  };

  const relevantLocs = getRelevantLocations();
  const relevantLocIds = relevantLocs.map(l => l.id);

  const filteredInventory = inventory.filter(inv => relevantLocIds.includes(inv.locationId));
  const filteredRequisitions = requisitions.filter(req =>
    relevantLocIds.includes(req.sourceLocationId) || relevantLocIds.includes(req.targetLocationId)
  );

  const stockData = items.map(item => {
    const total = filteredInventory
      .filter(rec => rec.itemId === item.id)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    return { name: item.name.split(' ')[0], total, fullName: item.name };
  });

  const pendingCount = filteredRequisitions.filter(r => r.status === 'PENDING').length;
  const transitCount = filteredRequisitions.filter(r => r.status === 'IN_TRANSIT').length;

  // --- REPORT LOGIC ---

  const reportData = useMemo(() => {
    const dateFilter = reportDate;

    // 1. Financials
    const dailyTxns = transactions.filter(t => t.date.startsWith(dateFilter));
    const sales = dailyTxns.filter(t => t.type === TransactionType.SALE);
    const expenses = dailyTxns.filter(t => t.type === TransactionType.EXPENSE);

    const totalSales = sales.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Stock Purchases (Entries)
    const purchases = accountingEntries.filter(e => e.date.startsWith(dateFilter));
    const totalPurchasesValue = purchases.reduce((acc, curr) => acc + curr.totalValue, 0);

    // 3. Logistics / Movements (Requisitions updated today)
    const movements = requisitions.filter(r => r.updatedAt.startsWith(dateFilter));

    // 4. HR / Absences
    const absences = performanceRecords.filter(p => p.date === dateFilter && p.status === AttendanceStatus.ABSENT);
    const absentWorkers = absences.map(r => allUsers.find(u => u.id === r.workerId)).filter(Boolean);

    return {
      sales,
      expenses,
      purchases,
      movements,
      absentWorkers,
      totalSales,
      totalExpenses,
      totalPurchasesValue
    };
  }, [reportDate, transactions, accountingEntries, requisitions, performanceRecords, allUsers]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Quick Navigation Buttons - Scrollable on Mobile */}
      {onNavigate && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={() => onNavigate('requisitions')}
            className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-left group active:scale-95"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2 md:mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Truck size={18} />
            </div>
            <h4 className="font-bold text-gray-800 text-sm md:text-base">Requisições</h4>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 line-clamp-1">Gerenciar pedidos</p>
          </button>

          <button
            onClick={() => onNavigate('inventory')}
            className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all text-left group active:scale-95"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-2 md:mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Package size={18} />
            </div>
            <h4 className="font-bold text-gray-800 text-sm md:text-base">Estoque</h4>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 line-clamp-1">Visualizar e adicionar</p>
          </button>

          <button
            onClick={() => onNavigate('performance')}
            className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all text-left group active:scale-95"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-2 md:mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ClipboardCheck size={18} />
            </div>
            <h4 className="font-bold text-gray-800 text-sm md:text-base">Desempenho</h4>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 line-clamp-1">RH e Produtividade</p>
          </button>

          {/* Report Button Protected by Permission */}
          {hasPermission('VIEW_REPORTS') && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all text-left group active:scale-95"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-2 md:mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <FileText size={18} />
              </div>
              <h4 className="font-bold text-gray-800 text-sm md:text-base">Relatórios</h4>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1 line-clamp-1">Visão Diária</p>
            </button>
          )}
        </div>
      )}

      {effectiveLocationId && (
        <div className="bg-blue-50 border border-blue-100 p-3 md:p-4 rounded-xl flex items-center gap-3 text-blue-800">
          <div className="bg-blue-100 p-2 rounded-lg">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base">Visualizando: {locations.find(l => l.id === effectiveLocationId)?.name}</h3>
            <p className="text-[10px] md:text-xs text-blue-600">Dados filtrados para este departamento.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Req. Pendentes</p>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Em Trânsito</p>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{transitCount}</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Tipos em Estoque</p>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-80 md:h-96">
          <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4">Níveis de Estoque</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <ReTooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.total < 5 ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- DAILY REPORT MODAL --- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white w-full md:max-w-5xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 md:p-6 shrink-0 flex justify-between items-start">
              <div>
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <FileText size={24} className="text-orange-400" />
                  Relatório Diário
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2">
                  <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="bg-transparent text-white text-sm outline-none cursor-pointer font-medium"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition hidden md:block" title="Imprimir">
                  <Printer size={20} />
                </button>
                <button onClick={() => setIsReportModalOpen(false)} className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition" title="Fechar" aria-label="Fechar">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 custom-scrollbar">

              {/* 1. Resumo Financeiro Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Vendas</span>
                  <div className="mt-1 flex items-center gap-1 md:gap-2 text-green-600">
                    <span className="text-lg md:text-2xl font-bold">{formatCurrency(reportData.totalSales)}</span>
                  </div>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Despesas</span>
                  <div className="mt-1 flex items-center gap-1 md:gap-2 text-red-600">
                    <span className="text-lg md:text-2xl font-bold">{formatCurrency(reportData.totalExpenses)}</span>
                  </div>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Compras</span>
                  <div className="mt-1 flex items-center gap-1 md:gap-2 text-blue-600">
                    <span className="text-lg md:text-2xl font-bold">{formatCurrency(reportData.totalPurchasesValue)}</span>
                  </div>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Faltas</span>
                  <div className="mt-1 flex items-center gap-1 md:gap-2 text-orange-600">
                    <span className="text-lg md:text-2xl font-bold">{reportData.absentWorkers.length}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 2. Detalhe Financeiro & Compras */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><DollarSign size={16} /> Movimento Financeiro</h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <tbody className="divide-y divide-gray-100">
                          {reportData.sales.concat(reportData.expenses).length === 0 ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs">Sem movimento financeiro.</td></tr>
                          ) : (
                            reportData.sales.concat(reportData.expenses).map((t, i) => (
                              <tr key={i}>
                                <td className="px-4 py-2">
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.type === TransactionType.SALE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {t.type === TransactionType.SALE ? 'ENT' : 'SAI'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-700 truncate max-w-[120px] text-xs">
                                  {t.clientName || t.description || t.category}
                                </td>
                                <td className={`px-4 py-2 text-right font-bold text-xs ${t.type === TransactionType.SALE ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(t.amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 3. Logística & RH */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><Truck size={16} /> Logística Hoje</h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {reportData.movements.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">Nenhuma movimentação.</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {reportData.movements.map((req, i) => (
                            <li key={i} className="px-4 py-3 text-sm">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-gray-800 text-xs">{getItemName(req.itemId)}</span>
                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{req.status}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                                <span>{getLocationName(req.sourceLocationId)}</span>
                                <ArrowRight size={10} />
                                <span>{getLocationName(req.targetLocationId)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
