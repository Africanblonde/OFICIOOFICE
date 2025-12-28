
import React from 'react';
import { useLogistics } from '../context/useLogistics';
import { ItemType, LocationType } from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';
import { Landmark, TrendingUp, DollarSign, PieChart, FileText, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';

export const Patrimony = () => {
  const { inventory, items, locations, accountingEntries } = useLogistics();

  // 1. Calculate Total Patrimony (Assets vs Liabilities/Consumables)
  let totalAssetValue = 0;
  let totalConsumableValue = 0;

  inventory.forEach(record => {
    const item = items.find(i => i.id === record.itemId);
    if (item) {
      const value = record.quantity * item.price;
      if (item.type === ItemType.ASSET) {
        totalAssetValue += value;
      } else {
        totalConsumableValue += value;
      }
    }
  });

  const totalValue = totalAssetValue + totalConsumableValue;

  // 2. Breakdown by Location
  const branches = locations.filter(l => l.type === LocationType.BRANCH);
  const locationData = branches.map(branch => {
    // Include Field teams in Branch value
    const childLocs = locations.filter(l => l.parentId === branch.id).map(l => l.id);
    const relevantLocIds = [branch.id, ...childLocs];
    
    let branchValue = 0;
    inventory.filter(rec => relevantLocIds.includes(rec.locationId)).forEach(rec => {
       const item = items.find(i => i.id === rec.itemId);
       if (item) branchValue += rec.quantity * item.price;
    });

    return {
      name: branch.name.replace('Filial ', ''),
      value: branchValue
    };
  });

  // 3. Asset Composition Data (Pie Chart)
  const assetComposition = [
    { name: 'Ativos (Bens Duráveis)', value: totalAssetValue, color: '#3b82f6' },
    { name: 'Consumíveis (Em Estoque)', value: totalConsumableValue, color: '#a855f7' }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Landmark className="text-blue-600" />
            Patrimônio & Contabilidade
          </h2>
          <p className="text-sm text-gray-500">Gestão financeira de ativos e estoque.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="relative z-10">
             <p className="text-sm text-gray-500 font-medium">Valor Total do Patrimônio</p>
             <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalValue)}</h3>
             <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
               <TrendingUp size={12} /> Posição Atual
             </p>
           </div>
           <DollarSign className="absolute right-4 top-4 text-gray-100" size={80} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="relative z-10">
             <p className="text-sm text-gray-500 font-medium">Ativos Fixos (Máquinas/Equip.)</p>
             <h3 className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(totalAssetValue)}</h3>
             <p className="text-xs text-gray-400 mt-1">Bens duráveis da empresa</p>
           </div>
           <PieChart className="absolute right-4 top-4 text-blue-50" size={80} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="relative z-10">
             <p className="text-sm text-gray-500 font-medium">Passivo Circulante (Consumíveis)</p>
             <h3 className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(totalConsumableValue)}</h3>
             <p className="text-xs text-gray-400 mt-1">Estoque rotativo (EPIs, Insumos)</p>
           </div>
           <FileText className="absolute right-4 top-4 text-purple-50" size={80} />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Value by Branch */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Valor de Estoque por Filial</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(val) => `MZN ${val/1000}k`} />
                  <ReTooltip formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Asset vs Consumable Split */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="font-bold text-gray-800 mb-4 w-full text-left">Composição do Patrimônio</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                    <Pie 
                      data={assetComposition} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80}
                      label 
                    >
                      {assetComposition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(val: number) => formatCurrency(val)} />
                 </RePieChart>
               </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs mt-2">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Ativos</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Consumíveis</span>
                </div>
            </div>
         </div>
      </div>

      {/* Accounting History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Histórico de Lançamentos Contábeis (Entradas)</h3>
            <button className="text-blue-600 text-sm hover:underline">Exportar Relatório</button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                 <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Local</th>
                    <th className="px-6 py-4 text-right">Qtd</th>
                    <th className="px-6 py-4 text-right">Preço Un.</th>
                    <th className="px-6 py-4 text-right">Total</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                 {accountingEntries.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                            Nenhum lançamento registrado recentemente.
                        </td>
                    </tr>
                 ) : (
                     accountingEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                           <td className="px-6 py-4 text-gray-600">{formatFlexibleDate(entry.date, { dateOnly: true })}</td>
                           <td className="px-6 py-4 font-medium text-gray-800">{entry.itemName}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${entry.type === 'ATIVO' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                                 {entry.type}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-gray-600">
                              {locations.find(l => l.id === entry.locationId)?.name}
                           </td>
                           <td className="px-6 py-4 text-right font-medium">{entry.quantity}</td>
                           <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(entry.unitPrice)}</td>
                           <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(entry.totalValue)}</td>
                        </tr>
                     ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
