import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import MainLayout from './components/Layout/MainLayout';
import MobileLayout from './components/Mobile/MobileLayout';
import MobileDashboard from './components/Mobile/MobileDashboard';
import MobileLogin from './components/Mobile/MobileLogin';
import MobileProducts from './components/Mobile/MobileProducts';
import MobileProductAdd from './components/Mobile/MobileProductAdd';
import MobileNotifications from './components/Mobile/MobileNotifications';
import MobileProfile from './components/Mobile/MobileProfile';
import MobileStockCount from './components/Mobile/MobileStockCount';
import MobileCustomers from './components/Mobile/MobileCustomers';
import MobileCategories from './components/Mobile/MobileCategories';
import MobileSuppliers from './components/Mobile/MobileSuppliers';
import MobileSales from './components/Mobile/MobileSales';
import MobileExpenses from './components/Mobile/MobileExpenses';
import MobileEmployees from './components/Mobile/MobileEmployees';
import MobileBranches from './components/Mobile/MobileBranches';
import MobileReports from './components/Mobile/MobileReports';
import MobileSettings from './components/Mobile/MobileSettings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import StockAlerts from './pages/StockAlerts';
import StockValuation from './pages/StockValuation';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import SalesDetail from './pages/SalesDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import StockManagement from './pages/StockManagement';
import StockMovements from './pages/StockMovementsUpgraded';
import StockCount from './pages/StockCountUpgraded';
import StockCountDetail from './pages/StockCountDetail';
import StockTransfer from './pages/StockTransfer';
import PurchaseOrders from './pages/PurchaseOrders';
import Returns from './pages/Returns';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import ProfitLoss from './pages/ProfitLoss';
import FinancialReports from './pages/FinancialReports';
import CashManagement from './pages/CashManagement';
import CashRegister from './pages/CashRegister';
import Shifts from './pages/Shifts';
import Branches from './pages/Branches';
import Employees from './pages/Employees';
import EmployeePerformance from './pages/EmployeePerformance';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import DownloadAPK from './pages/DownloadAPK';

const App: React.FC = () => {
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  
  // 📱 Detect if running as native app
  const isNativeApp = Capacitor.isNativePlatform();

  // Tema'yı her değiştiğinde uygula
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 📱 Configure StatusBar for native apps
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const configureStatusBar = async () => {
        try {
          // Set status bar style based on theme
          if (theme === 'dark') {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#1F1F1F' });
          } else {
            await StatusBar.setStyle({ style: Style.Light });
            await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
          }
        } catch (error) {
          console.error('StatusBar config failed:', error);
        }
      };

      configureStatusBar();
    }
  }, [theme, isNativeApp]);

  // 📱 Select layout based on platform
  const LayoutComponent = isNativeApp ? MobileLayout : MainLayout;

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : (isNativeApp ? <MobileLogin /> : <Login />)} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
        <Route path="/reset-password" element={token ? <Navigate to="/dashboard" /> : <ResetPassword />} />
        
        {/* Mobile-only routes WITHOUT layout (full screen pages) */}
        {isNativeApp && token && (
          <>
            <Route path="/products/add" element={<MobileProductAdd />} />
            <Route path="/notifications" element={<MobileNotifications />} />
            <Route path="/profile" element={<MobileProfile />} />
            <Route path="/stock-count" element={<MobileStockCount />} />
            <Route path="/customers" element={<MobileCustomers />} />
            <Route path="/categories" element={<MobileCategories />} />
            <Route path="/suppliers" element={<MobileSuppliers />} />
            <Route path="/sales" element={<MobileSales />} />
            <Route path="/expenses" element={<MobileExpenses />} />
            <Route path="/employees" element={<MobileEmployees />} />
            <Route path="/branches" element={<MobileBranches />} />
            <Route path="/reports" element={<MobileReports />} />
            <Route path="/settings" element={<MobileSettings />} />
          </>
        )}

        <Route element={token ? <LayoutComponent /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={isNativeApp ? <MobileDashboard /> : <Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={isNativeApp ? <MobileProducts /> : <Products />} />
          {!isNativeApp && <Route path="/products/:id" element={<ProductDetail />} />}
          {!isNativeApp && <Route path="/stock-alerts" element={<StockAlerts />} />}
          {!isNativeApp && <Route path="/stock-valuation" element={<StockValuation />} />}
          {!isNativeApp && (
            <>
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/sales/:id" element={<SalesDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </>
          )}
          <Route path="/stock-management" element={<StockManagement />} />
          <Route path="/stock-movements" element={<StockMovements />} />
          <Route path="/stock-count" element={<StockCount />} />
          <Route path="/stock-count/:id" element={<StockCountDetail />} />
          <Route path="/stock-transfer" element={<StockTransfer />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/financial-reports" element={<FinancialReports />} />
          {!isNativeApp && <Route path="/expenses" element={<Expenses />} />}
          <Route path="/profit-loss" element={<ProfitLoss />} />
          <Route path="/cash-management" element={<CashManagement />} />
          <Route path="/cash-register" element={<CashRegister />} />
          <Route path="/shifts" element={<Shifts />} />
          {!isNativeApp && <Route path="/branches" element={<Branches />} />}
          {!isNativeApp && <Route path="/employees" element={<Employees />} />}
          {!isNativeApp && <Route path="/employee-performance" element={<EmployeePerformance />} />}
          <Route path="/activity-logs" element={<ActivityLogs />} />
          {!isNativeApp && <Route path="/profile" element={<Profile />} />}
          <Route path="/user-management" element={<UserManagement />} />
          {!isNativeApp && <Route path="/download" element={<DownloadAPK />} />}
          {/* More pages will be added here */}
        </Route>

        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
