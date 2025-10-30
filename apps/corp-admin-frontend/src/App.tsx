import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Licenses from './pages/Licenses';
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;


