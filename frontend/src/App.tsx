import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import MainLayout from './components/Layout/MainLayout';
import MobileLayout from './components/Mobile/MobileLayout';
import MobileDashboard from './components/Mobile/MobileDashboard';
import MobileProducts from './components/Mobile/MobileProducts';
import MobileProductAdd from './components/Mobile/MobileProductAdd';
import MobileNotifications from './components/Mobile/MobileNotifications';
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
import StockMovements from './pages/StockMovements';
import StockCount from './pages/StockCount';
import StockTransfer from './pages/StockTransfer';
import PurchaseOrders from './pages/PurchaseOrders';
import Returns from './pages/Returns';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import ProfitLoss from './pages/ProfitLoss';
import CashRegister from './pages/CashRegister';
import Shifts from './pages/Shifts';
import Branches from './pages/Branches';
import Employees from './pages/Employees';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';

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
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
        
        <Route element={token ? <LayoutComponent /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={isNativeApp ? <MobileDashboard /> : <Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={isNativeApp ? <MobileProducts /> : <Products />} />
          <Route path="/products/add" element={isNativeApp ? <MobileProductAdd /> : <Products />} />
          <Route path="/notifications" element={isNativeApp ? <MobileNotifications /> : <Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/stock-movements" element={<StockMovements />} />
          <Route path="/stock-count" element={<StockCount />} />
          <Route path="/stock-transfer" element={<StockTransfer />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/profit-loss" element={<ProfitLoss />} />
          <Route path="/cash-register" element={<CashRegister />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user-management" element={<UserManagement />} />
          {/* More pages will be added here */}
        </Route>

        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
