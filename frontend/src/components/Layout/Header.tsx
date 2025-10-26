import React, { useState, useEffect } from 'react';
import { Moon, Sun, Sparkles, Calendar, Clock, LogOut, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/30 px-3 md:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 md:gap-6">
        <div>
          {/* Desktop: Full welcome message */}
          <div className="hidden md:flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              Hoş Geldiniz
            </h2>
          </div>
          
          {/* Mobile: Only clock (compact) */}
          <div className="md:hidden flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-base font-semibold text-slate-900 dark:text-white tabular-nums">
              {currentTime.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </span>
          </div>
          
          {/* Desktop: Date & Time */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>
                {currentTime.toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="tabular-nums">
                {currentTime.toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30 border border-blue-200 dark:border-blue-900 rounded-lg shadow-sm">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>

        {/* User Info - Sağ Üst Köşe */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30 border border-blue-200 dark:border-blue-900 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Desktop: Show name & role */}
            <div className="hidden md:flex flex-col items-start">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{user?.role}</p>
            </div>
            {/* Mobile: Only icon */}
            <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg font-semibold transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Aydınlık Tema' : 'Karanlık Tema'}
          className="w-9 h-9 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-blue-600" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </Button>
      </div>
    </header>
  );
};

export default Header;

