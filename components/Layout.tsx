
import React, { useState } from 'react';
import { useLogistics } from '../context/useLogistics';
import { LocationType, Role, RequestStatus } from '../types';
import {
  LayoutDashboard,
  Package,
  Truck,
  UserCircle,
  ClipboardCheck,
  Building2,
  ChevronRight,
  CheckCircle,
  Globe,
  RefreshCw,
  Bell,
  Menu,
  X,
  Briefcase,
  Settings,
  Landmark,
  ShoppingCart,
  Shield,
  Banknote,
  LogOut
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const {
    currentUser,
    // allUsers and setCurrentUser removed to prevent client impersonation
    locations,
    selectedDepartmentId,
    setSelectedDepartmentId,
    requisitions,
    updateRequisitionStatus,
    getWorkersByLocation,
    refreshData,
    lastUpdated,
    notification,
    isAdminOrGM,
    hasPermission
  } = useLogistics();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Wrapper para refreshData com feedback visual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Usuário clicou em Sincronizar');
      await refreshData();
      // Se ainda estiver como WORKER após refresh, fazer hard reload
      setTimeout(() => {
        if (currentUser?.role === 'WORKER' && currentUser?.email === 'davidjuniormuianga@gmail.com') {
          console.log('⚠️ Ainda WORKER após refresh, fazendo hard reload...');
          window.location.reload();
        }
      }, 1000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading if user not loaded yet
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 animate-pulse">
            <span className="text-3xl">🌲</span>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case Role.GENERAL_MANAGER: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case Role.MANAGER: return 'bg-blue-100 text-blue-800 border-blue-200';
      case Role.WORKER: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false); // Close menu on selection (mobile)
  };

  const handleDepartmentClick = (locId: string) => {
    setSelectedDepartmentId(locId);
    handleTabClick('dashboard');
    setIsMobileMenuOpen(false);
  };

  const handleResetAndNavigate = (tab: string) => {
    setSelectedDepartmentId(null); // Explicitly clear filter
    handleTabClick(tab);
    setIsMobileMenuOpen(false);
  };

  // Logic for Quick Approval in Sidebar
  const pendingReqs = requisitions.filter(r => r.status === RequestStatus.PENDING);
  const hasPending = pendingReqs.length > 0;
  // Admin and General Manager can approve (or check permission)
  const canApprove = hasPermission('MANAGE_REQUISITIONS');

  const handleApproveAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja aprovar TODAS as ${pendingReqs.length} requisições pendentes?`)) {
      pendingReqs.forEach(req => {
        updateRequisitionStatus(req.id, RequestStatus.APPROVED);
      });
      handleTabClick('requisitions');
    }
  };

  const branches = locations.filter(l => l.type === LocationType.BRANCH);
  const currentDepartmentName = selectedDepartmentId
    ? locations.find(l => l.id === selectedDepartmentId)?.name
    : 'Visão Global';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out
        lg:static lg:w-64 lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700 cursor-pointer flex justify-between items-center bg-slate-950" onClick={() => handleResetAndNavigate('dashboard')}>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/50">O</div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">OFFICE FLORESTAL</h1>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Logística & Gestão</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}
            className="lg:hidden text-slate-400 hover:text-white p-2"
            aria-label="Fechar menu"
            title="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {hasPermission('VIEW_DASHBOARD') && (
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium text-sm">Visão Geral</span>
            </button>
          )}

          {hasPermission('VIEW_REQUISITIONS') && (
            <div className="space-y-1">
              <button
                onClick={() => handleTabClick('requisitions')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${activeTab === 'requisitions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-3">
                  <Truck size={20} />
                  <span className="font-medium text-sm">Requisições</span>
                </div>
                {hasPending && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {pendingReqs.length}
                  </span>
                )}
              </button>

              {/* Quick Approve Button */}
              {canApprove && hasPending && (
                <div className="px-4 pb-2">
                  <button
                    onClick={handleApproveAll}
                    className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded flex items-center justify-center gap-2 transition-colors shadow-sm font-medium border border-emerald-500"
                  >
                    <CheckCircle size={14} />
                    Aprovar {pendingReqs.length} Pendentes
                  </button>
                </div>
              )}
            </div>
          )}

          {hasPermission('VIEW_INVENTORY') && (
            <button
              onClick={() => handleTabClick('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Package size={20} />
              <span className="font-medium text-sm">Estoque</span>
            </button>
          )}

          {hasPermission('VIEW_PERFORMANCE') && (
            <button
              onClick={() => handleTabClick('performance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'performance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <ClipboardCheck size={20} />
              <span className="font-medium text-sm">Desempenho</span>
            </button>
          )}

          {hasPermission('VIEW_POS') && (
            <button
              onClick={() => handleTabClick('pos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'pos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <ShoppingCart size={20} />
              <span className="font-medium text-sm">POS & Financeiro</span>
            </button>
          )}

          {hasPermission('VIEW_PATRIMONY') && (
            <button
              onClick={() => handleTabClick('patrimony')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'patrimony' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Landmark size={20} />
              <span className="font-medium text-sm">Patrimônio</span>
            </button>
          )}

          {hasPermission('VIEW_HR') && (
            <button
              onClick={() => handleTabClick('hr')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'hr' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Briefcase size={20} />
              <span className="font-medium text-sm">Recursos Humanos</span>
            </button>
          )}

          {hasPermission('VIEW_PAYROLL') && (
            <button
              onClick={() => handleTabClick('payroll')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Banknote size={20} />
              <span className="font-medium text-sm">Folha Salarial</span>
            </button>
          )}

          {hasPermission('VIEW_SETTINGS') && (
            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Settings size={20} />
              <span className="font-medium text-sm">Definições</span>
            </button>
          )}

          {hasPermission('MANAGE_PERMISSIONS') && (
            <button
              onClick={() => handleTabClick('permissions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'permissions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Shield size={20} />
              <span className="font-medium text-sm">Permissões</span>
            </button>
          )}

          <div className="pt-4 mt-2 border-t border-slate-700">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">Filiais</p>
            <div className="space-y-1">
              <button
                onClick={() => handleResetAndNavigate('dashboard')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors text-sm ${!selectedDepartmentId ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={16} />
                  <span className="font-medium">Todas</span>
                </div>
                {!selectedDepartmentId && <CheckCircle size={14} className="text-emerald-500" />}
              </button>

              {branches.map(branch => {
                const workerCount = getWorkersByLocation(branch.id).length;
                return (
                  <button
                    key={branch.id}
                    onClick={() => handleDepartmentClick(branch.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors text-sm ${selectedDepartmentId === branch.id ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={16} />
                      <span className="font-medium truncate max-w-[120px]">{branch.name.replace('Filial ', '')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {workerCount > 0 && (
                        <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded-full" title={`${workerCount} trabalhadores`}>{workerCount}</span>
                      )}
                      {selectedDepartmentId === branch.id && <ChevronRight size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Removed impersonation selector: users should not be able to switch current user in the UI */}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden active:bg-gray-200 transition-colors"
              aria-label="Abrir menu"
              title="Abrir menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 capitalize flex items-center gap-2 leading-tight">
                {activeTab === 'dashboard' ? 'Dashboard' :
                  activeTab === 'inventory' ? 'Estoque' :
                    activeTab === 'requisitions' ? 'Requisições' :
                      activeTab === 'performance' ? 'Desempenho' :
                        activeTab === 'hr' ? 'RH' :
                          activeTab === 'payroll' ? 'Folha Salarial' :
                            activeTab === 'settings' ? 'Definições' :
                              activeTab === 'patrimony' ? 'Patrimônio' :
                                activeTab === 'pos' ? 'POS & Vendas' :
                                  activeTab === 'permissions' ? 'Permissões' :
                                    'Office Florestal'}
              </h2>
              {selectedDepartmentId && (
                <div className="flex items-center text-xs text-blue-600 font-medium">
                  <span className="truncate max-w-[200px]">{currentDepartmentName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Auto Refresh Indicator - Mobile Friendly (Icon Only on small) */}
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-2 md:px-3 py-1.5 rounded-full border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="hidden md:inline">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`hover:text-blue-600 transition-colors p-1 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                title="Sincronizar agora"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className={`hidden md:block px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(currentUser.role)}`}>
              {currentUser.role.replace('_', ' ')}
            </div>

            <div className="flex items-center gap-2 text-gray-600 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
              <UserCircle size={20} className="text-gray-500" />
              <span className="text-xs font-bold truncate max-w-[60px] md:max-w-none">{currentUser.name.split(' ')[0]}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              title="Sair"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </header>
        {/* Content Area with specific mobile padding */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>

        {/* Notification Toast - Mobile Optimized Position */}
        {notification && (
          <div className="fixed top-4 left-4 right-4 md:top-auto md:left-auto md:bottom-6 md:right-6 bg-slate-900/95 backdrop-blur text-white px-4 py-3 rounded-lg shadow-2xl z-[60] animate-in slide-in-from-top-4 md:slide-in-from-bottom-4 transition-all flex items-center gap-3 border border-slate-700">
            <Bell size={20} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">{notification}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
