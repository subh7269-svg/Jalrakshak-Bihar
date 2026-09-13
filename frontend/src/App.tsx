import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ScenarioModal } from './components/common/ScenarioModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { PriorityPage } from './pages/PriorityPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SheltersPage } from './pages/SheltersPage';
import { RoadsPage } from './pages/RoadsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { DataSourcesPage } from './pages/DataSourcesPage';

export const App: React.FC = () => {
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScenarioApplied = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app-container">
            <Sidebar />
            <div className="main-content" key={refreshKey}>
              <Header onOpenSimulation={() => setSimulationOpen(true)} />
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
                <Route path="/priority" element={<PriorityPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/shelters" element={<SheltersPage />} />
                <Route path="/roads" element={<RoadsPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
                <Route path="/data-sources" element={<DataSourcesPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>

          <ScenarioModal 
            isOpen={simulationOpen} 
            onClose={() => setSimulationOpen(false)}
            onScenarioApplied={handleScenarioApplied}
          />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
