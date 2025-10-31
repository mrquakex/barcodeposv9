import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Loader2 } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
          >
            <div className="p-6">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default Layout;

