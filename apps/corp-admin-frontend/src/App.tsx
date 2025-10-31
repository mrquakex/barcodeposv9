import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Licenses from './pages/Licenses';
import UsersPage from './pages/Users';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import SystemHealth from './pages/SystemHealth';
import Billing from './pages/Billing';
import ApiManagement from './pages/ApiManagement';
import Webhooks from './pages/Webhooks';
import Reports from './pages/Reports';
import Layout from './components/Layout';

const App: React.FC = () => {
  const { isAuthenticated, getMe, token } = useAuthStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      getMe().catch(() => {});
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="licenses" element={<Licenses />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="system-health" element={<SystemHealth />} />
          <Route path="billing" element={<Billing />} />
          <Route path="api-management" element={<ApiManagement />} />
          <Route path="webhooks" element={<Webhooks />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;


