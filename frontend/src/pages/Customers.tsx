import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  debt: number;
  loyaltyPoints: number;
  totalSpent: number;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created');
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Customers</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
            {filteredCustomers.length} customers
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Add Customer
        </FluentButton>
      </div>

      {/* Search */}
      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customers by name, email, or phone..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <FluentCard key={customer.id} depth="depth-4" hoverable className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="fluent-body font-medium text-foreground truncate">
                  {customer.name}
                </h4>
                {customer.email && (
                  <p className="fluent-caption text-foreground-secondary flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" />
                    {customer.email}
                  </p>
                )}
                {customer.phone && (
                  <p className="fluent-caption text-foreground-secondary flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Debt</span>
                <FluentBadge appearance={customer.debt > 0 ? 'error' : 'success'} size="small">
                  ₺{customer.debt.toFixed(2)}
                </FluentBadge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Total Spent</span>
                <span className="text-sm text-foreground font-medium">
                  ₺{customer.totalSpent.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">Points</span>
                <span className="text-sm text-primary font-medium">
                  {customer.loyaltyPoints} pts
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1"
                icon={<Edit className="w-3 h-3" />}
                onClick={() => handleEdit(customer)}
              >
                Edit
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1 text-destructive hover:bg-destructive/10"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={() => handleDelete(customer.id)}
              >
                Delete
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FluentInput
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<User className="w-4 h-4" />}
            required
          />
          <FluentInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="w-4 h-4" />}
          />
          <FluentInput
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={<Phone className="w-4 h-4" />}
          />
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter address..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={handleCloseDialog}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              {editingCustomer ? 'Update' : 'Create'}
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default Customers;

