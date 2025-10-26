import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  description: string;
  user?: { name: string };
  createdAt: string;
}

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/activity-logs');
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'warning';
      case 'DELETE':
        return 'error';
      case 'LOGIN':
      case 'LOGOUT':
        return 'info';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="fluent-title text-foreground">Activity Logs</h1>
        <p className="fluent-body text-foreground-secondary mt-1">{logs.length} activities</p>
      </div>

      <FluentCard depth="depth-4" className="p-4">
        <FluentInput placeholder="Search logs..." icon={<Search className="w-4 h-4" />} />
      </FluentCard>

      <div className="space-y-2">
        {logs.map((log) => (
          <FluentCard key={log.id} depth="depth-4" hoverable className="p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FluentBadge appearance={getActionColor(log.action) as any} size="small">
                    {log.action}
                  </FluentBadge>
                  <span className="fluent-caption text-foreground-tertiary">{log.module}</span>
                  {log.user && (
                    <span className="fluent-caption text-foreground-secondary">
                      by {log.user.name}
                    </span>
                  )}
                  <span className="fluent-caption text-foreground-tertiary">
                    {new Date(log.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="fluent-body-small text-foreground">{log.description}</p>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>
    </div>
  );
};

export default ActivityLogs;

