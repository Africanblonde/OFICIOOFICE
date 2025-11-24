import React, { useState } from 'react';
import { LogisticsProvider } from './context/LogisticsContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Requisitions } from './pages/Requisitions';
import { Inventory } from './pages/Inventory';
import { Performance } from './pages/Performance';

function App() {
  // Simple state-based routing since BrowserRouter is restricted for path changes
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'requisitions': return <Requisitions />;
      case 'inventory': return <Inventory />;
      case 'performance': return <Performance />;
      default: return <Dashboard />;
    }
  };

  return (
    <LogisticsProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>
    </LogisticsProvider>
  );
}

export default App;