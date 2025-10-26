import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Breadcrumbs from '../components/Breadcrumbs';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

/* ============================================
   INVOICE CREATE PAGE (Apple Invoice Style)
   Numbers/Pages Style Invoice Creation
   ============================================ */

interface InvoiceItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

const InvoiceCreate: React.FC = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{
    id: '1',
    productName: '',
    quantity: 1,
    price: 0,
  }]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productName: '',
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error('En az 1 ürün olmalıdır');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleSave = () => {
    if (!customerName.trim()) {
      toast.error('Müşteri adı gereklidir');
      return;
    }

    if (items.some(item => !item.productName.trim())) {
      toast.error('Tüm ürünlerin adı olmalıdır');
      return;
    }

    // TODO: Implement save invoice API
    toast.success('Fatura oluşturuldu');
    navigate('/invoices');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="plain"
            size="icon"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-[34px] font-bold text-foreground tracking-tight">
              Yeni Fatura
            </h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              Fatura bilgilerini girin
            </p>
          </div>
        </div>

        <Button variant="filled" size="default" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Kaydet
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Müşteri Adı *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Müşteri adını girin"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ürünler</CardTitle>
                <Button variant="tinted" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4" />
                  Ürün Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-end gap-3 p-4 rounded-[10px] bg-muted"
                  >
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`product-${item.id}`}>Ürün Adı</Label>
                      <Input
                        id={`product-${item.id}`}
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(item.id, 'productName', e.target.value)
                        }
                        placeholder="Ürün adı"
                      />
                    </div>

                    <div className="w-24 space-y-2">
                      <Label htmlFor={`quantity-${item.id}`}>Adet</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                        }
                      />
                    </div>

                    <div className="w-32 space-y-2">
                      <Label htmlFor={`price-${item.id}`}>Fiyat</Label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(item.id, 'price', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">
                      {item.productName || `Ürün ${index + 1}`} ({item.quantity}x)
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[17px] font-semibold text-foreground">
                    Toplam
                  </span>
                  <span className="text-[28px] font-bold text-primary">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button variant="filled" size="default" className="w-full" onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Faturayı Kaydet
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="w-full"
                  onClick={() => navigate('/invoices')}
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreate;

