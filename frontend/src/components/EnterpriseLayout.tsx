import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const EnterpriseLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS', href: '/pos', icon: ShoppingCart },
    { name: 'Ürünler', href: '/products', icon: Package },
    { name: 'Satışlar', href: '/sales', icon: TrendingUp },
    { name: 'Raporlar', href: '/reports', icon: BarChart3 },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="enterprise-layout">
      {/* Sidebar */}
      <aside className={`enterprise-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {sidebarOpen ? (
              <>
                <ShoppingCart className="logo-icon" />
                <span className="logo-text">BarcodePOS</span>
              </>
            ) : (
              <ShoppingCart className="logo-icon-small" />
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${active ? 'active' : ''}`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
                {active && <div className="active-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="/mobile/dashboard"
            className="nav-item mobile-link"
            title={!sidebarOpen ? 'Mobil App' : undefined}
          >
            <Smartphone size={20} />
            {sidebarOpen && <span>Mobil App</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="enterprise-main">
        {/* Top Bar */}
        <header className="enterprise-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Ürün ara, satış bul..."
                className="search-input"
              />
              <kbd className="search-kbd">Ctrl+K</kbd>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Bildirimler">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>

            <div className="user-menu">
              <button
                className="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.name || 'Kullanıcı'}</span>
                  <span className="user-role">Yönetici</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <User size={16} />
                    <span>Profil</span>
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <Settings size={16} />
                    <span>Ayarlar</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button onClick={logout} className="dropdown-item danger">
                    <LogOut size={16} />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="enterprise-content">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default EnterpriseLayout;

