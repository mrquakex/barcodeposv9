import React from 'react';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          Hoş Geldiniz
          <span className="ml-2 px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
            ENTERPRISE
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('tr-TR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Advanced System</span>
        </div>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Aydınlık Tema' : 'Karanlık Tema'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
};

export default Header;

