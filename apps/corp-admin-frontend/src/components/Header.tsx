import React from 'react';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { GlobalSearch } from './GlobalSearch';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const Header: React.FC = () => {
  const { admin, logout } = useAuthStore();

  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'count'],
    queryFn: async () => {
      const response = await api.get('/alerts', { params: { status: 'active' } });
      return response.data;
    },
    refetchInterval: 30000,
  });

  const activeAlertsCount = alertsData?.alerts?.filter((a: any) => a.status === 'active').length || 0;
  const criticalAlertsCount = alertsData?.alerts?.filter((a: any) => a.severity === 'critical').length || 0;

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <Link to="/alerts" aria-label="Uyarılar">
          <Button variant="ghost" size="icon" className="relative" aria-label={`${activeAlertsCount} aktif uyarı`}>
            <Bell className="h-5 w-5" />
            {activeAlertsCount > 0 && (
              <Badge
                variant={criticalAlertsCount > 0 ? 'destructive' : 'default'}
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                aria-label={`${activeAlertsCount} aktif uyarı`}
              >
                {activeAlertsCount}
              </Badge>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{admin?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{admin?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Ayarlar</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/mfa" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>MFA Kurulumu</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
