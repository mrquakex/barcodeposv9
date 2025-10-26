import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, CheckCircle, ClipboardList } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface StockCount {
  id: string;
  countNumber: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  user: { name: string };
  _count?: { items: number };
}

const StockCount: React.FC = () => {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ type: 'FULL' });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const response = await api.get('/stock-counts');
      setCounts(response.data);
    } catch (error) {
      toast.error('Failed to fetch counts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/stock-counts', formData);
      toast.success('Stock count created');
      fetchCounts();
      setShowDialog(false);
    } catch (error) {
      toast.error('Failed to create count');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Stock Count</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{counts.length} counts</p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          New Count
        </FluentButton>
      </div>

      <div className="space-y-3">
        {counts.map((count) => (
          <FluentCard key={count.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">{count.countNumber}</h4>
                  <FluentBadge
                    appearance={count.status === 'COMPLETED' ? 'success' : 'warning'}
                    size="small"
                  >
                    {count.status}
                  </FluentBadge>
                  <FluentBadge appearance="info" size="small">
                    {count.type}
                  </FluentBadge>
                </div>
                <div className="flex gap-4 text-sm text-foreground-secondary">
                  <span>By: {count.user.name}</span>
                  <span>Items: {count._count?.items || 0}</span>
                  <span>
                    {new Date(count.startedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <FluentButton appearance="subtle" size="small" icon={<Eye className="w-4 h-4" />}>
                View
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      <FluentDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Stock Count"
        size="small"
      >
        <div className="space-y-4">
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ type: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="FULL">Full Count</option>
              <option value="PARTIAL">Partial Count</option>
              <option value="CATEGORY">By Category</option>
            </select>
          </div>
          <div className="flex gap-2">
            <FluentButton appearance="subtle" className="flex-1" onClick={() => setShowDialog(false)}>
              Cancel
            </FluentButton>
            <FluentButton appearance="primary" className="flex-1" onClick={handleCreate}>
              Create
            </FluentButton>
          </div>
        </div>
      </FluentDialog>
    </div>
  );
};

export default StockCount;

