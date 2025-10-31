import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tenants = lazy(() => import('./pages/Tenants'));
const Licenses = lazy(() => import('./pages/Licenses'));
const UsersPage = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const Billing = lazy(() => import('./pages/Billing'));
const ApiManagement = lazy(() => import('./pages/ApiManagement'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const Reports = lazy(() => import('./pages/Reports'));
const MFASetup = lazy(() => import('./pages/MFASetup'));
const SecurityAudit = lazy(() => import('./pages/SecurityAudit'));
const Alerts = lazy(() => import('./pages/Alerts'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const DataOperations = lazy(() => import('./pages/DataOperations'));
const Integrations = lazy(() => import('./pages/Integrations'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const Monitoring = lazy(() => import('./pages/Monitoring'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
          <Route 
            index 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="tenants" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Tenants />
              </Suspense>
            } 
          />
          <Route 
            path="licenses" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Licenses />
              </Suspense>
            } 
          />
          <Route 
            path="users" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <UsersPage />
              </Suspense>
            } 
          />
          <Route 
            path="settings" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Settings />
              </Suspense>
            } 
          />
          <Route 
            path="settings/mfa" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MFASetup />
              </Suspense>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Analytics />
              </Suspense>
            } 
          />
          <Route 
            path="audit-logs" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AuditLogs />
              </Suspense>
            } 
          />
          <Route 
            path="security-audit" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SecurityAudit />
              </Suspense>
            } 
          />
          <Route 
            path="system-health" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SystemHealth />
              </Suspense>
            } 
          />
          <Route 
            path="billing" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Billing />
              </Suspense>
            } 
          />
          <Route 
            path="api-management" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ApiManagement />
              </Suspense>
            } 
          />
          <Route 
            path="api-docs" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ApiDocs />
              </Suspense>
            } 
          />
          <Route 
            path="webhooks" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Webhooks />
              </Suspense>
            } 
          />
          <Route 
            path="reports" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Reports />
              </Suspense>
            } 
          />
          <Route 
            path="alerts" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Alerts />
              </Suspense>
            } 
          />
          <Route 
            path="role-management" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <RoleManagement />
              </Suspense>
            } 
          />
          <Route 
            path="admin-management" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AdminManagement />
              </Suspense>
            } 
          />
          <Route 
            path="data-operations" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <DataOperations />
              </Suspense>
            } 
          />
          <Route 
            path="integrations" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Integrations />
              </Suspense>
            } 
          />
          <Route 
            path="advanced-analytics" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AdvancedAnalytics />
              </Suspense>
            } 
          />
          <Route 
            path="monitoring" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Monitoring />
              </Suspense>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
