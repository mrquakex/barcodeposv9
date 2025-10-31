import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

const Header: React.FC = () => {
  const { logout, admin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            className="pl-9"
            disabled
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute top-1 right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">0</Badge>
        </Button>
        <div className="h-8 w-px bg-border mx-2" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">{admin?.name}</div>
            <div className="text-xs text-muted-foreground">{admin?.email}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Çıkış">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

