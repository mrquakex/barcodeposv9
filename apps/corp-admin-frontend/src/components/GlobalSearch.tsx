import React, { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Link } from 'react-router-dom';
import { Building2, Key, Users, FileText } from 'lucide-react';
import { debounce } from '@/lib/utils';

interface SearchResult {
  type: 'tenant' | 'license' | 'user' | 'audit';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export const GlobalSearch: React.FC = () => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return { results: [] };
      // In production, implement unified search endpoint
      // For now, return empty results
      return { results: [] as SearchResult[] };
    },
    enabled: search.length >= 2,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'tenant':
        return <Building2 className="h-4 w-4" />;
      case 'license':
        return <Key className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Global ara... (Ctrl+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-9"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        {search.length < 2 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Aramaya başlamak için en az 2 karakter girin
          </div>
        ) : isLoading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : searchResults?.results?.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Sonuç bulunamadı
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {searchResults?.results?.map((result: SearchResult) => (
              <Link
                key={`${result.type}-${result.id}`}
                to={result.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
              >
                <div className="p-1.5 bg-primary/10 rounded">
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

