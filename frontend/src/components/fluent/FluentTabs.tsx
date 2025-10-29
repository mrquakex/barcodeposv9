import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface FluentTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const FluentTabs: React.FC<FluentTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn('border-b border-border', className)}>
      <nav className="flex space-x-2" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors',
                'hover:text-foreground hover:border-border',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-secondary'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-background-alt text-foreground-secondary'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default FluentTabs;

