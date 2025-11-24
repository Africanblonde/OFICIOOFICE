import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Role } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { TrendingUp, ShieldCheck, Activity, MapPin } from 'lucide-react';

export const Dashboard = () => {
  const { inventory, requisitions, items, locations, currentUser, selectedDepartmentId } = useLogistics();

  // Determine which location to focus on
  // If selectedDepartmentId is set via Sidebar, use it.
  // Otherwise, if user is Manager/Worker, use their location.
  // If Admin and no selection, use 'all'.
  const effectiveLocationId = selectedDepartmentId 
    ? selectedDepartmentId 
    : (currentUser.role === Role.ADMIN ? null : currentUser.locationId);

  // Filter data helpers
  const getRelevantLocations = () => {
    if (!effectiveLocationId) return locations;
    // Return the location itself and its children
    return locations.filter(l => l.id === effectiveLocationId || l.parentId === effectiveLocationId);
  };

  const relevantLocs = getRelevantLocations();
  const relevantLocIds = relevantLocs.map(l => l.id);

  const filteredInventory = inventory.filter(inv => relevantLocIds.includes(inv.locationId));
  const filteredRequisitions = requisitions.filter(req => 
    relevantLocIds.includes(req.sourceLocationId) || relevantLocIds.includes(req.targetLocationId)
  );

  // Prepare Chart Data: Total stock per item across relevant locations
  const stockData = items.map(item => {
    const total = filteredInventory
      .filter(rec => rec.itemId === item.id)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    return { name: item.name.split(' ')[0], total, fullName: item.name };
  });

  const pendingCount = filteredRequisitions.filter(r => r.status === 'PENDING').length;
  const transitCount = filteredRequisitions.filter(r => r.status === 'IN_TRANSIT').length;

  return (
    <div className="space-y-6">
      {/* Context Banner if Filtered */}
      {effectiveLocationId && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3 text-blue-800">
           <div className="bg-blue-100 p-2 rounded-lg">
             <MapPin size={20} />
           </div>
           <div>
             <h3 className="font-bold">Visualizando: {locations.find(l => l.id === effectiveLocationId)?.name}</h3>
             <p className="text-xs text-blue-600">Dados filtrados para este departamento e suas equipes de campo.</p>
           </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Requisições Pendentes</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Em Trânsito</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{transitCount}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Tipos de Item em Estoque</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Níveis de Estoque {effectiveLocationId ? 'Local' : 'Global'}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
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
    </div>
  );
};