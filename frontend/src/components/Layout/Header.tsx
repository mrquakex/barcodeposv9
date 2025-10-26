import React, { useState, useEffect } from 'react';
import { Moon, Sun, Sparkles, Calendar, Clock } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-20 border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/30 px-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent flex items-center gap-2">
              Hoş Geldiniz
            </h2>
            <span className="px-3 py-1 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-slate-700 rounded-full shadow-lg">
              ENTERPRISE
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
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
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-base">
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
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30 border-2 border-blue-200 dark:border-blue-900 rounded-xl shadow-md">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Advanced System</span>
        </div>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Aydınlık Tema' : 'Karanlık Tema'}
          className="w-10 h-10 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl"
        >
          {theme === 'dark' ? <Sun className="w-6 h-6 text-blue-600" /> : <Moon className="w-6 h-6 text-slate-700" />}
        </Button>
      </div>
    </header>
  );
};

export default Header;

