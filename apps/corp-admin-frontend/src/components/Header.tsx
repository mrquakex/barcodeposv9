import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { logout, admin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          BarcodePOS Control Plane
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">{admin?.role}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış
        </button>
      </div>
    </header>
  );
};

export default Header;

