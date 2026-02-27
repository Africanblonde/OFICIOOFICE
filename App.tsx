
import React, { useState, useEffect } from 'react';
import { LogisticsProvider } from './context/LogisticsContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Requisitions } from './pages/Requisitions';
import { Inventory } from './pages/Inventory';
import { Performance } from './pages/Performance';
import { HumanResources } from './pages/HumanResources';
import { Settings } from './pages/Settings';
import { Patrimony } from './pages/Patrimony';
import { POS } from './pages/POS';
import { Permissions } from './pages/Permissions';
import { Payroll } from './pages/Payroll';
import { FichasIndividuais } from './pages/FichasIndividuais';
import { Chat } from './pages/Chat';
import ContasAReceber from './pages/ContasAReceber';
import ExpenseApprovals from './pages/ExpenseApprovals';
import ExpenseBudgetReports from './pages/ExpenseBudgetReports';
import { AuthPage } from './pages/AuthPage';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'chat': return <Chat />;
      case 'requisitions': return <Requisitions />;
      case 'inventory': return <Inventory />;
      case 'performance': return <Performance />;
      case 'hr': return <HumanResources />;
      case 'settings': return <Settings />;
      case 'patrimony': return <Patrimony />;
      case 'pos': return <POS />;
      case 'permissions': return <Permissions />;
      case 'payroll': return <Payroll />;
      case 'fichas': return <FichasIndividuais />;
      case 'contas-receber': return <ContasAReceber />;
      case 'expense-approvals': return <ExpenseApprovals />;
      case 'expense-reports': return <ExpenseBudgetReports />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  // Loading state
  if (loading) {
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

  // Not authenticated - show auth page
  if (!session) {
    return <AuthPage onAuthSuccess={() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    }} />;
  }

  // Authenticated - show main app
  return (
    <LogisticsProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>
    </LogisticsProvider>
  );
}

export default App;
