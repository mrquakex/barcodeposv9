import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import FluentSidebar from './FluentSidebar';
import FluentHeader from './FluentHeader';
import FluentToastContainer from '../fluent/FluentToast';
import { AIChatWidget } from '../AIChat/AIChatWidget';
import { useAuthStore } from '../../store/authStore';

/* ============================================
   MAIN LAYOUT - Microsoft Fluent Design
   Desktop: Sidebar + Header + Content
   Mobile: Drawer Sidebar + Header + Content
   ============================================ */

const MainLayout: React.FC = () => {
  const { getMe, user } = useAuthStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch user data on mount if not already loaded
    if (!user) {
      getMe();
    }
  }, [getMe, user]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 💠 Sidebar - Desktop: Always visible | Mobile: Drawer */}
      <FluentSidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 💠 Header - Mobile: With hamburger menu */}
        <FluentHeader onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto fluent-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Toast Container */}
      <FluentToastContainer />

      {/* 🤖 AI Chat Widget - Microsoft Fluent Style */}
      <AIChatWidget />
    </div>
  );
};

export default MainLayout;

