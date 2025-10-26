import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  supplier: { name: string };
  orderDate: string;
  expectedDate?: string;
  _count?: { items: number };
}

const PurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/purchase-orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
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
          <h1 className="fluent-title text-foreground">Purchase Orders</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{orders.length} orders</p>
        </div>
        <FluentButton appearance="primary" icon={<Plus className="w-4 h-4" />}>
          New Order
        </FluentButton>
      </div>

      <FluentCard depth="depth-4" className="p-4">
        <FluentInput placeholder="Search orders..." icon={<Search className="w-4 h-4" />} />
      </FluentCard>

      <div className="space-y-3">
        {orders.map((order) => (
          <FluentCard key={order.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">{order.orderNumber}</h4>
                  <FluentBadge
                    appearance={
                      order.status === 'RECEIVED'
                        ? 'success'
                        : order.status === 'CANCELLED'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {order.status}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>Supplier: {order.supplier.name}</span>
                  <span>Items: {order._count?.items || 0}</span>
                  <span>
                    Paid: ₺{order.paidAmount.toFixed(2)} / ₺{order.totalAmount.toFixed(2)}
                  </span>
                  <span>
                    {new Date(order.orderDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <p className="fluent-heading text-foreground">₺{order.totalAmount.toFixed(2)}</p>
                <FluentButton appearance="subtle" size="small" icon={<Eye className="w-4 h-4" />}>
                  View
                </FluentButton>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">No orders yet</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;

