import React from 'react';
import { Outlet } from 'react-router-dom';
import FluentSidebar from './FluentSidebar';
import FluentHeader from './FluentHeader';
import FluentToastContainer from '../fluent/FluentToast';

/* ============================================
   MAIN LAYOUT - Fluent Design
   Sidebar + Header + Content
   ============================================ */

const MainLayout: React.FC = () => {
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

