import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  _count?: { users: number };
}

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      toast.error('Failed to fetch branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, formData);
        toast.success('Branch updated');
      } else {
        await api.post('/branches', formData);
        toast.success('Branch created');
      }
      fetchBranches();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save branch');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingBranch(null);
    setFormData({ name: '', address: '', phone: '' });
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
          <h1 className="fluent-title text-foreground">Branches</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{branches.length} branches</p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Add Branch
        </FluentButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <FluentCard key={branch.id} elevation="depth4" hover className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">{branch.name}</h4>
                  <FluentBadge appearance={branch.isActive ? 'success' : 'error'} size="small">
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </FluentBadge>
                </div>
                {branch.address && (
                  <p className="fluent-caption text-foreground-secondary mb-1">{branch.address}</p>
                )}
                {branch.phone && (
                  <p className="fluent-caption text-foreground-secondary">{branch.phone}</p>
                )}
                <p className="fluent-caption text-primary mt-2">
                  {branch._count?.users || 0} employees
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1"
                icon={<Edit className="w-3 h-3" />}
                onClick={() => handleEdit(branch)}
              >
                Edit
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingBranch ? 'Edit Branch' : 'Add Branch'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label="Branch Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FluentInput
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={handleCloseDialog}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              {editingBranch ? 'Update' : 'Create'}
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default Branches;

