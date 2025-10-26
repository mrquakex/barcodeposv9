import React, { useState } from 'react';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import FluentButton from '../fluent/FluentButton';
import FluentBadge from '../fluent/FluentBadge';
import { cn } from '../../lib/utils';

/* ============================================
   FLUENT HEADER - Command Bar Style
   ============================================ */

const FluentHeader: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
      {/* Left: Mobile menu */}
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 hover:bg-background-alt rounded">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:block">
          <p className="fluent-body text-foreground-secondary">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-background-alt rounded transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground-secondary" />
          ) : (
            <Moon className="w-5 h-5 text-foreground-secondary" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-background-alt rounded transition-colors relative"
          >
            <Bell className="w-5 h-5 text-foreground-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md fluent-depth-16 z-50">
              <div className="p-4 border-b border-border">
                <h3 className="fluent-subtitle text-foreground">Notifications</h3>
              </div>
              <div className="p-4">
                <p className="fluent-body-small text-foreground-secondary text-center">
                  No new notifications
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-alt rounded transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="fluent-body-small font-medium text-foreground">{user?.name}</p>
              <p className="fluent-caption text-foreground-secondary">{user?.role}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md fluent-depth-16 z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-destructive hover:bg-destructive/10 rounded fluent-body-small transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default FluentHeader;

