import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Package, Users, ShoppingCart, FileText, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

/* ============================================
   APPLE SPOTLIGHT-STYLE GLOBAL SEARCH
   Cmd+K / Ctrl+K to open
   ============================================ */

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  path: string;
  category: string;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Quick Actions (Static)
  const quickActions: SearchResult[] = [
    { id: '1', title: 'Dashboard', subtitle: 'Ana sayfa', icon: TrendingUp, path: '/dashboard', category: 'Sayfa' },
    { id: '2', title: 'Satış Yap', subtitle: 'Yeni satış ekranı', icon: ShoppingCart, path: '/pos', category: 'İşlem' },
    { id: '3', title: 'Ürünler', subtitle: 'Ürün listesi', icon: Package, path: '/products', category: 'Sayfa' },
    { id: '4', title: 'Müşteriler', subtitle: 'Müşteri listesi', icon: Users, path: '/customers', category: 'Sayfa' },
    { id: '5', title: 'Raporlar', subtitle: 'İstatistikler ve raporlar', icon: FileText, path: '/reports', category: 'Sayfa' },
  ];

  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(quickActions);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter results
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredResults(quickActions);
    } else {
      const filtered = quickActions.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Trigger Button (Header'da gösterilecek) */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2',
          'px-3 py-2',
          'rounded-[10px]',
          'bg-input',
          'border border-border',
          'text-muted-foreground',
          'hover:border-primary/30',
          'transition-all duration-200',
          'min-w-[200px]'
        )}
      >
        <Search className="w-4 h-4" />
        <span className="text-[15px] font-normal">Ara...</span>
        <kbd className="ml-auto px-2 py-0.5 rounded bg-muted text-[11px] font-medium border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Spotlight Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={handleClose}
            />

            {/* Search Modal (Spotlight Style) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'fixed top-[20%] left-1/2 -translate-x-1/2',
                'w-full max-w-2xl',
                'bg-card',
                'rounded-[16px]',
                'border border-border',
                'apple-shadow-xl',
                'overflow-hidden',
                'z-50'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Ara veya bir işlem seç..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className={cn(
                    'flex-1',
                    'bg-transparent',
                    'text-[17px]',
                    'text-foreground',
                    'placeholder:text-muted-foreground',
                    'outline-none',
                    'border-0'
                  )}
                />
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-[8px] hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {filteredResults.length > 0 ? (
                  <div className="space-y-1">
                    {filteredResults.map((result) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={cn(
                            'w-full',
                            'flex items-center gap-3',
                            'px-4 py-3',
                            'rounded-[10px]',
                            'hover:bg-muted',
                            'transition-all duration-150',
                            'group',
                            'text-left'
                          )}
                        >
                          <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-foreground truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-[13px] text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground px-2 py-1 rounded bg-muted/50">
                            {result.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-[15px] text-muted-foreground">Sonuç bulunamadı</p>
                    <p className="text-[13px] text-muted-foreground/70 mt-1">
                      Farklı bir arama deneyin
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Hint */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-medium">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-medium">↓</kbd>
                    <span>Gezin</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-medium">↵</kbd>
                    <span>Seç</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-medium">esc</kbd>
                    <span>Kapat</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Command className="w-3 h-3" />
                  <span>Spotlight Search</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalSearch;

