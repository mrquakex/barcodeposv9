import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import FluentSidebar from './FluentSidebar';
import FluentHeader from './FluentHeader';
import FluentToastContainer from '../fluent/FluentToast';
import { useAuthStore } from '../../store/authStore';

/* ============================================
   MAIN LAYOUT - Fluent Design
   Sidebar + Header + Content
   ============================================ */

const MainLayout: React.FC = () => {
  const { getMe, user } = useAuthStore();

  useEffect(() => {
    // Fetch user data on mount if not already loaded
    if (!user) {
      getMe();
    }
  }, [getMe, user]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <FluentSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <FluentHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto fluent-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Toast Container */}
      <FluentToastContainer />
    </div>
  );
};

export default MainLayout;

