import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { LocationType, Role, RequestStatus } from '../types';
import { USERS } from '../constants';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  UserCircle, 
  Users,
  ClipboardCheck,
  Building2,
  ChevronRight,
  CheckCircle,
  Globe,
  RefreshCw
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    locations, 
    selectedDepartmentId, 
    setSelectedDepartmentId, 
    requisitions, 
    updateRequisitionStatus,
    getWorkersByLocation,
    refreshData,
    lastUpdated
  } = useLogistics();

  const getRoleColor = (role: Role) => {
    switch(role) {
      case Role.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case Role.MANAGER: return 'bg-blue-100 text-blue-800 border-blue-200';
      case Role.WORKER: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDepartmentClick = (locId: string) => {
    setSelectedDepartmentId(locId);
    onTabChange('dashboard'); // Go to dashboard when selecting a department
  };

  const handleResetAndNavigate = (tab: string) => {
    setSelectedDepartmentId(null); // Explicitly clear filter
    onTabChange(tab);
  };

  // Logic for Quick Approval in Sidebar
  const pendingReqs = requisitions.filter(r => r.status === RequestStatus.PENDING);
  const hasPending = pendingReqs.length > 0;
  const isAdmin = currentUser.role === Role.ADMIN;

  const handleApproveAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja aprovar TODAS as ${pendingReqs.length} requisições pendentes?`)) {
      pendingReqs.forEach(req => {
        updateRequisitionStatus(req.id, RequestStatus.APPROVED);
      });
      // Optionally switch to requisitions tab to see changes
      onTabChange('requisitions');
    }
  };

  const branches = locations.filter(l => l.type === LocationType.BRANCH);
  const currentDepartmentName = selectedDepartmentId 
    ? locations.find(l => l.id === selectedDepartmentId)?.name 
    : 'Visão Global';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700 cursor-pointer" onClick={() => handleResetAndNavigate('dashboard')}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold">O</div>
            <h1 className="text-xl font-bold tracking-tight">OFFICIO OFFICE</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Hierarquia & Controle</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Visão Geral</span>
          </button>
          
          <div className="space-y-1">
            <button 
              onClick={() => onTabChange('requisitions')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeTab === 'requisitions' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <Truck size={20} />
                <span className="font-medium">Requisições</span>
              </div>
              {hasPending && (
                <span className="bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingReqs.length}
                </span>
              )}
            </button>

            {/* Quick Approve Button for Admin */}
            {isAdmin && hasPending && (
              <div className="px-4 pb-2">
                 <button
                    onClick={handleApproveAll}
                    className="w-full text-xs bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors shadow-sm font-medium animate-pulse"
                 >
                    <CheckCircle size={14} />
                    Aprovar {pendingReqs.length} Pendentes
                 </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => onTabChange('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Package size={20} />
            <span className="font-medium">Estoque</span>
          </button>

          <button 
            onClick={() => onTabChange('performance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'performance' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <ClipboardCheck size={20} />
            <span className="font-medium">Desempenho</span>
          </button>

          <div className="pt-4 mt-2 border-t border-slate-700">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase mb-3">Departamentos</p>
            <div className="space-y-1">
              <button 
                onClick={() => handleResetAndNavigate('dashboard')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors text-sm ${!selectedDepartmentId ? 'bg-blue-900/30 text-blue-200 border border-blue-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                 <div className="flex items-center gap-3">
                   <Globe size={16} />
                   <span className="font-medium">Todas as Filiais</span>
                 </div>
                 {!selectedDepartmentId && <CheckCircle size={14} />}
              </button>

              {branches.map(branch => {
                const workerCount = getWorkersByLocation(branch.id).length;
                return (
                  <button 
                    key={branch.id}
                    onClick={() => handleDepartmentClick(branch.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors text-sm ${selectedDepartmentId === branch.id ? 'bg-blue-900/50 text-blue-200 border border-blue-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={16} />
                      <span className="font-medium truncate">{branch.name.replace('Filial ', '')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {workerCount > 0 && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full" title={`${workerCount} trabalhadores`}>{workerCount}</span>
                       )}
                       {selectedDepartmentId === branch.id && <ChevronRight size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 bg-slate-800 m-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-2 text-slate-300 text-sm">
            <Users size={16} />
            <span>Simular Usuário:</span>
          </div>
          <select 
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
            value={currentUser.id}
            onChange={(e) => {
              const u = USERS.find(user => user.id === e.target.value);
              if (u) setCurrentUser(u);
            }}
          >
            {USERS.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 capitalize flex items-center gap-2">
              {activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'inventory' ? 'Estoque' : 
               activeTab === 'requisitions' ? 'Requisições' :
               'Desempenho'}
               
               {selectedDepartmentId && (
                 <>
                  <ChevronRight size={16} className="text-gray-400" />
                  <span className="text-blue-600">{currentDepartmentName}</span>
                 </>
               )}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Auto Refresh Indicator */}
             <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span>Sincronizado: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               <button 
                onClick={refreshData}
                className="ml-1 hover:text-blue-600 transition-colors" 
                title="Sincronizar agora"
               >
                 <RefreshCw size={12} />
               </button>
             </div>

            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(currentUser.role)}`}>
              {currentUser.role}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <UserCircle size={24} />
              <span className="text-sm font-medium">{currentUser.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
