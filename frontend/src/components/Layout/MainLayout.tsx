import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuthStore } from '../../store/authStore';

const MainLayout: React.FC = () => {
  const { isAuthenticated, getMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      getMe();
    }
  }, [isAuthenticated, getMe]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default MainLayout;


