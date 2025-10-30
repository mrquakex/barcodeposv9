import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  BarChart3, 
  Package, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Download,
  Upload,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
  className = ''
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (position) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [position, onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    
    if (item.submenu) {
      setSubmenuOpen(submenuOpen === item.id ? null : item.id);
    } else {
      item.onClick?.();
      onClose();
    }
  };

  if (!position) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          zIndex: 9999
        }}
        className={`
          min-w-[220px] max-w-[280px]
          bg-card backdrop-blur-xl
          border border-border/50
          rounded-xl shadow-2xl
          overflow-hidden
          ${className}
        `}
      >
        <div className="py-2">
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.divider ? (
                <div className="h-px bg-border/50 my-2" />
              ) : (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`
                    w-full px-4 py-2.5
                    flex items-center justify-between gap-3
                    text-left text-sm font-medium
                    transition-all duration-150
                    ${item.disabled 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'cursor-pointer hover:text-primary'
                    }
                    ${item.danger 
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' 
                      : 'text-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.icon && (
                      <span className={`
                        w-5 h-5 flex items-center justify-center
                        ${item.danger ? 'text-red-600' : 'text-foreground-secondary'}
                      `}>
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <span className="text-xs text-foreground-secondary/60 font-mono">
                        {item.shortcut}
                      </span>
                    )}
                    {item.submenu && (
                      <MoreHorizontal className="w-4 h-4 text-foreground-secondary" />
                    )}
                  </div>
                </motion.button>
              )}
              
              {/* Submenu */}
              {item.submenu && submenuOpen === item.id && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-4 pl-4 border-l-2 border-primary/20"
                >
                  {item.submenu.map((subItem) => (
                    <motion.button
                      key={subItem.id}
                      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.08)' }}
                      onClick={() => {
                        if (!subItem.disabled) {
                          subItem.onClick?.();
                          onClose();
                        }
                      }}
                      disabled={subItem.disabled}
                      className={`
                        w-full px-3 py-2
                        flex items-center gap-2
                        text-left text-sm
                        transition-colors
                        ${subItem.disabled 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'cursor-pointer hover:text-primary'
                        }
                      `}
                    >
                      {subItem.icon && (
                        <span className="w-4 h-4">{subItem.icon}</span>
                      )}
                      <span>{subItem.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing context menu state
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu
  };
};

// Predefined icon exports for convenience
export const ContextMenuIcons = {
  Edit,
  Delete: Trash2,
  Copy,
  View: Eye,
  Chart: BarChart3,
  Package,
  Increase: TrendingUp,
  Decrease: TrendingDown,
  Refresh: RefreshCw,
  Download,
  Upload,
  Star,
  Unstar: StarOff,
  Archive,
  Unarchive: ArchiveRestore,
  More: MoreHorizontal,
  Success: CheckCircle,
  Cancel: XCircle,
  Warning: AlertTriangle,
  Info
};

