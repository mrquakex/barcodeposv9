import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCog } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  branch?: { name: string };
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    branchId: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      toast.success('Employee created');
      fetchEmployees();
      setShowDialog(false);
      setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create employee');
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
          <h1 className="fluent-title text-foreground">Employees</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{employees.length} employees</p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Add Employee
        </FluentButton>
      </div>

      <FluentCard depth="depth-4" className="p-4">
        <FluentInput placeholder="Search employees..." icon={<Search className="w-4 h-4" />} />
      </FluentCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee) => (
          <FluentCard key={employee.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <UserCog className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">{employee.name}</h4>
                  <FluentBadge
                    appearance={employee.isActive ? 'success' : 'error'}
                    size="small"
                  >
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </FluentBadge>
                </div>
                <p className="fluent-caption text-foreground-secondary mb-1">{employee.email}</p>
                <div className="flex items-center gap-2">
                  <FluentBadge appearance="info" size="small">
                    {employee.role}
                  </FluentBadge>
                  {employee.branch && (
                    <span className="fluent-caption text-foreground-tertiary">
                      {employee.branch.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      <FluentDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="Add Employee"
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FluentInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <FluentInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
            </select>
          </div>
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">Branch</label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={() => setShowDialog(false)}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              Create
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default Employees;

