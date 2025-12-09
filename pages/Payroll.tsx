
import React, { useState } from 'react';
import { useLogistics } from '../context/useLogistics';
import { Banknote, Calculator, DollarSign, TrendingDown, Users } from 'lucide-react';
import { PayrollRecord } from '../types';

export const Payroll = () => {
  const { allUsers, calculatePayrollForUser, updatePayrollParams, payrollParams } = useLogistics();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Process data for all users
  const payrollData: PayrollRecord[] = allUsers.map(user => calculatePayrollForUser(user));

  // Totals
  const totalBase = payrollData.reduce((acc, curr) => acc + curr.baseSalary, 0);
  const totalBonus = payrollData.reduce((acc, curr) => acc + curr.productionBonus, 0);
  const totalNet = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalDeductions = payrollData.reduce((acc, curr) => acc + curr.totalDeductions, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Banknote className="text-green-600" />
            Folha Salarial (Payroll)
          </h2>
          <p className="text-sm text-gray-500">Modelo Florestal: (Dias x Taxa) + Bónus - Descontos</p>
        </div>
        <div className="flex items-center gap-3">
             <input 
               type="month" 
               className="border rounded-lg p-2 bg-white text-gray-800 shadow-sm"
               value={selectedMonth}
               onChange={e => setSelectedMonth(e.target.value)}
             />
             <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-green-700 flex items-center gap-2">
                 <Calculator size={18} /> Processar
             </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
             <p className="text-xs font-bold text-gray-400 uppercase">Total Líquido a Pagar</p>
             <h3 className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalNet)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
             <p className="text-xs font-bold text-gray-400 uppercase">Total Salário Base</p>
             <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBase)}</h3>
             <p className="text-xs text-gray-500 mt-1">Dias Úteis</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
             <p className="text-xs font-bold text-gray-400 uppercase">Total Bónus Produção</p>
             <h3 className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalBonus)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
             <p className="text-xs font-bold text-gray-400 uppercase">Total Descontos</p>
             <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDeductions)}</h3>
             <p className="text-xs text-gray-500 mt-1">Faltas e Adiantamentos</p>
          </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Funcionário</th>
                <th className="px-6 py-4 text-center text-green-700 bg-green-50/50" title="Dias Completos">D</th>
                <th className="px-6 py-4 text-center text-orange-700 bg-orange-50/50" title="Meios Dias">D/2</th>
                <th className="px-6 py-4 text-center text-red-700 bg-red-50/50" title="Faltas">F</th>
                <th className="px-6 py-4 text-center">Produção (Real/Meta)</th>
                <th className="px-6 py-4 text-right font-bold bg-blue-50/50">Salário Base</th>
                <th className="px-6 py-4 text-right text-blue-600">Bónus</th>
                <th className="px-6 py-4 text-center w-24 text-red-600">Adiant.</th>
                <th className="px-6 py-4 text-right text-red-600">T. Desc.</th>
                <th className="px-6 py-4 text-right font-bold text-green-700 bg-green-50">Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrollData.map((record) => (
                <tr key={record.userId} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{record.userName}</td>
                  
                  {/* Attendance Stats */}
                  <td className="px-6 py-4 text-center font-bold text-green-700 bg-green-50/30">{record.fullDays}</td>
                  <td className="px-6 py-4 text-center font-bold text-orange-700 bg-orange-50/30">{record.halfDays}</td>
                  <td className="px-6 py-4 text-center font-bold text-red-700 bg-red-50/30">{record.absences}</td>

                  {/* Production Stats */}
                  <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                          <span className="font-bold">{record.realProduction}</span>
                          <span className="text-[10px] text-gray-400">Meta: {record.targetProduction}</span>
                          <span className={`text-[10px] font-bold ${record.efficiency >= 100 ? 'text-green-600' : 'text-orange-500'}`}>
                              {record.efficiency}%
                          </span>
                      </div>
                  </td>
                  
                  {/* Base Salary */}
                  <td className="px-6 py-4 text-right font-bold bg-blue-50/30">{formatCurrency(record.baseSalary)}</td>
                  
                  {/* Bonus */}
                  <td className="px-6 py-4 text-right text-blue-600">{formatCurrency(record.productionBonus)}</td>
                  
                  {/* Editable Advances */}
                  <td className="px-6 py-4 text-center">
                      <input 
                        type="number" 
                        min="0"
                        className="w-20 border rounded p-1 text-center bg-white focus:ring-1 focus:ring-red-500 outline-none text-red-600 font-medium"
                        value={payrollParams[record.userId]?.advances || 0}
                        onChange={(e) => updatePayrollParams(record.userId, parseFloat(e.target.value) || 0)}
                      />
                  </td>

                  {/* Total Deductions (Absences + Advances) */}
                  <td className="px-6 py-4 text-right text-red-600">{formatCurrency(record.totalDeductions)}</td>

                  {/* Net Salary */}
                  <td className="px-6 py-4 text-right font-bold text-green-700 bg-green-50 text-base border-l border-green-100">
                      {formatCurrency(record.netSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
