import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
        
        <Route element={token ? <MainLayout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          {/* More pages will be added here */}
        </Route>

        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
