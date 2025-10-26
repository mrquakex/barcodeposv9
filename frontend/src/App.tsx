import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Toast from './components/ui/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import ProductsNew from './pages/ProductsNew';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import StockMovements from './pages/StockMovements';
import Expenses from './pages/Expenses';
import Finance from './pages/Finance';
import PurchaseOrders from './pages/PurchaseOrders';
import Sales from './pages/Sales';
import SalesReport from './pages/Reports/SalesReport';
import ProductReport from './pages/Reports/ProductReport';
import Campaigns from './pages/Campaigns';
import Coupons from './pages/Coupons';
import Branches from './pages/Branches';
import ActivityLogs from './pages/ActivityLogs';
import UserManagement from './pages/UserManagement';
import AIChat from './pages/AIChat';

const App: React.FC = () => {
  return (
    <>
      <Toast />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<ProductsNew />} />
            <Route path="categories" element={<Categories />} />
            <Route path="sales" element={<Sales />} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="stock-movements" element={<StockMovements />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="finance" element={<Finance />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/sales" element={<SalesReport />} />
            <Route path="reports/products" element={<ProductReport />} />
            <Route path="reports/financial" element={<Finance />} />
            <Route path="reports/customers" element={<Reports />} />
            <Route path="reports/stock" element={<StockMovements />} />
            <Route path="reports/profitability" element={<Finance />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="branches" element={<Branches />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="ai-chat" element={<AIChat />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
