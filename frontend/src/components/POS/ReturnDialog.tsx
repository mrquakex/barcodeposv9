import React, { useState, useEffect } from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentInput from '../fluent/FluentInput';
import FluentButton from '../fluent/FluentButton';
import { Search, RotateCcw, Package, Calendar, User, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface Sale {
  id: string;
  receiptNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
  } | null;
  items: SaleItem[];
}

interface SaleItem {
  id: string;
  productId: string;
  barcode: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReturnItem {
  saleItemId: string;
  quantity: number;
  maxQuantity: number;
}

interface ReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onReturnComplete: () => void;
}

const ReturnDialog: React.FC<ReturnDialogProps> = ({ open, onClose, onReturnComplete }) => {
  const [searchType, setSearchType] = useState<'receipt' | 'date'>('receipt');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<Map<string, ReturnItem>>(new Map());
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset all states when dialog closes
      setSearchType('receipt');
      setReceiptNumber('');
      setDateFrom('');
      setDateTo('');
      setSearchResults([]);
      setSelectedSale(null);
      setReturnItems(new Map());
      setIsSearching(false);
      setIsProcessing(false);
    } else {
      // Set today's date as default for date search
      const today = new Date().toISOString().split('T')[0];
      setDateFrom(today);
      setDateTo(today);
    }
  }, [open]);

  const handleSearch = async () => {
    if (searchType === 'receipt' && !receiptNumber.trim()) {
      toast.error('Lütfen fiş numarası girin');
      return;
    }
    if (searchType === 'date' && (!dateFrom || !dateTo)) {
      toast.error('Lütfen tarih aralığı seçin');
      return;
    }

    setIsSearching(true);
    try {
      let response;
      if (searchType === 'receipt') {
        // Search by receipt number
        response = await api.get(`/sales/receipt/${receiptNumber}`);
        setSearchResults(response.data ? [response.data] : []);
      } else {
        // Search by date range
        response = await api.get('/sales/search', {
          params: {
            dateFrom,
            dateTo,
          }
        });
        setSearchResults(response.data || []);
      }

      if (searchResults.length === 0) {
        toast.error('Satış bulunamadı');
      }
    } catch (error: any) {
      console.error('Sale search error:', error);
      toast.error(error.response?.data?.message || 'Satış arama hatası');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    // Initialize return items map
    const newReturnItems = new Map<string, ReturnItem>();
    sale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: 0,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const handleUpdateReturnQuantity = (saleItemId: string, quantity: number) => {
    const item = returnItems.get(saleItemId);
    if (!item) return;

    const clampedQuantity = Math.max(0, Math.min(quantity, item.maxQuantity));
    const newReturnItems = new Map(returnItems);
    newReturnItems.set(saleItemId, {
      ...item,
      quantity: clampedQuantity,
    });
    setReturnItems(newReturnItems);
  };

  const handleSelectAllItems = () => {
    if (!selectedSale) return;
    const newReturnItems = new Map<string, ReturnItem>();
    selectedSale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: item.quantity,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const handleClearSelection = () => {
    if (!selectedSale) return;
    const newReturnItems = new Map<string, ReturnItem>();
    selectedSale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: 0,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const calculateReturnTotal = (): number => {
    if (!selectedSale) return 0;
    let total = 0;
    selectedSale.items.forEach(item => {
      const returnItem = returnItems.get(item.id);
      if (returnItem && returnItem.quantity > 0) {
        total += item.price * returnItem.quantity;
      }
    });
    return total;
  };

  const handleProcessReturn = async () => {
    if (!selectedSale) return;

    const itemsToReturn = Array.from(returnItems.values()).filter(item => item.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Lütfen iade edilecek ürünleri seçin');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post('/sales/return', {
        saleId: selectedSale.id,
        items: itemsToReturn.map(item => ({
          saleItemId: item.saleItemId,
          quantity: item.quantity,
        })),
      });

      toast.success(`İade işlemi başarılı! Toplam: ₺${calculateReturnTotal().toFixed(2)}`);
      onReturnComplete();
      onClose();
    } catch (error: any) {
      console.error('Return process error:', error);
      toast.error(error.response?.data?.message || 'İade işlemi başarısız');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="İade İşlemi"
      size="large"
    >
      <div className="space-y-4">
        {/* Search Section */}
        {!selectedSale && (
          <>
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <FluentButton
                appearance={searchType === 'receipt' ? 'primary' : 'subtle'}
                onClick={() => setSearchType('receipt')}
                icon={<Search className="w-4 h-4" />}
                size="small"
              >
                Fiş No
              </FluentButton>
              <FluentButton
                appearance={searchType === 'date' ? 'primary' : 'subtle'}
                onClick={() => setSearchType('date')}
                icon={<Calendar className="w-4 h-4" />}
                size="small"
              >
                Tarih
              </FluentButton>
            </div>

            {searchType === 'receipt' ? (
              <div className="flex gap-2">
                <FluentInput
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Fiş numarasını girin..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                <FluentButton
                  appearance="primary"
                  onClick={handleSearch}
                  disabled={isSearching}
                  icon={<Search className="w-4 h-4" />}
                >
                  {isSearching ? 'Aranıyor...' : 'Ara'}
                </FluentButton>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="fluent-caption font-medium text-foreground block mb-1.5">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="fluent-caption font-medium text-foreground block mb-1.5">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <FluentButton
                  appearance="primary"
                  onClick={handleSearch}
                  disabled={isSearching}
                  icon={<Search className="w-4 h-4" />}
                  className="w-full"
                >
                  {isSearching ? 'Aranıyor...' : 'Ara'}
                </FluentButton>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-md p-3">
                <p className="fluent-caption font-semibold text-foreground-secondary">
                  {searchResults.length} satış bulundu
                </p>
                {searchResults.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => handleSelectSale(sale)}
                    className={cn(
                      'p-3 border-2 rounded-md cursor-pointer transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      'border-border bg-background'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="fluent-body font-semibold text-foreground">
                          Fiş No: {sale.receiptNumber}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          {new Date(sale.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="fluent-body-large font-bold text-primary">
                          ₺{sale.total.toFixed(2)}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                    {sale.customer && (
                      <div className="flex items-center gap-1 text-foreground-secondary">
                        <User className="w-3 h-3" />
                        <span className="fluent-caption">{sale.customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-foreground-secondary mt-1">
                      <Package className="w-3 h-3" />
                      <span className="fluent-caption">{sale.items.length} ürün</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Return Details Section */}
        {selectedSale && (
          <div className="space-y-4">
            {/* Sale Header */}
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div>
                <p className="fluent-title-3 text-foreground">
                  Fiş No: {selectedSale.receiptNumber}
                </p>
                <p className="fluent-caption text-foreground-secondary">
                  {new Date(selectedSale.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              <FluentButton
                appearance="subtle"
                onClick={() => setSelectedSale(null)}
                size="small"
              >
                Geri Dön
              </FluentButton>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <FluentButton
                appearance="default"
                onClick={handleSelectAllItems}
                icon={<CheckCircle2 className="w-4 h-4" />}
                size="small"
              >
                Tümünü Seç
              </FluentButton>
              <FluentButton
                appearance="subtle"
                onClick={handleClearSelection}
                icon={<XCircle className="w-4 h-4" />}
                size="small"
              >
                Temizle
              </FluentButton>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-md p-3">
              {selectedSale.items.map((item) => {
                const returnItem = returnItems.get(item.id);
                if (!returnItem) return null;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 border-2 rounded-md transition-all',
                      returnItem.quantity > 0
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="fluent-body font-semibold text-foreground">
                          {item.productName}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          Barkod: {item.barcode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="fluent-body font-medium text-foreground">
                          ₺{item.price.toFixed(2)} x {item.quantity}
                        </p>
                        <p className="fluent-body-small font-bold text-primary">
                          ₺{item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="fluent-caption font-medium text-foreground">
                        İade Adedi:
                      </label>
                      <div className="flex items-center gap-2">
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          onClick={() => handleUpdateReturnQuantity(item.id, returnItem.quantity - 1)}
                          disabled={returnItem.quantity <= 0}
                        >
                          -
                        </FluentButton>
                        <input
                          type="number"
                          min="0"
                          max={returnItem.maxQuantity}
                          value={returnItem.quantity}
                          onChange={(e) => handleUpdateReturnQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center bg-background border border-border rounded fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          onClick={() => handleUpdateReturnQuantity(item.id, returnItem.quantity + 1)}
                          disabled={returnItem.quantity >= returnItem.maxQuantity}
                        >
                          +
                        </FluentButton>
                        <span className="fluent-caption text-foreground-secondary ml-2">
                          (Max: {returnItem.maxQuantity})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Return Summary */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between fluent-body font-medium text-foreground">
                <span>Orijinal Toplam:</span>
                <span>₺{selectedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between fluent-title-2 font-bold text-destructive">
                <span>İade Tutarı:</span>
                <span>₺{calculateReturnTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={onClose}
              >
                İptal
              </FluentButton>
              <FluentButton
                appearance="primary"
                className="flex-1"
                onClick={handleProcessReturn}
                disabled={isProcessing || calculateReturnTotal() === 0}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                {isProcessing ? 'İşleniyor...' : 'İade İşlemini Tamamla'}
              </FluentButton>
            </div>
          </div>
        )}
      </div>
    </FluentDialog>
  );
};

export default ReturnDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentInput from '../fluent/FluentInput';
import FluentButton from '../fluent/FluentButton';
import { Search, RotateCcw, Package, Calendar, User, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface Sale {
  id: string;
  receiptNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
  } | null;
  items: SaleItem[];
}

interface SaleItem {
  id: string;
  productId: string;
  barcode: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReturnItem {
  saleItemId: string;
  quantity: number;
  maxQuantity: number;
}

interface ReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onReturnComplete: () => void;
}

const ReturnDialog: React.FC<ReturnDialogProps> = ({ open, onClose, onReturnComplete }) => {
  const [searchType, setSearchType] = useState<'receipt' | 'date'>('receipt');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<Map<string, ReturnItem>>(new Map());
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset all states when dialog closes
      setSearchType('receipt');
      setReceiptNumber('');
      setDateFrom('');
      setDateTo('');
      setSearchResults([]);
      setSelectedSale(null);
      setReturnItems(new Map());
      setIsSearching(false);
      setIsProcessing(false);
    } else {
      // Set today's date as default for date search
      const today = new Date().toISOString().split('T')[0];
      setDateFrom(today);
      setDateTo(today);
    }
  }, [open]);

  const handleSearch = async () => {
    if (searchType === 'receipt' && !receiptNumber.trim()) {
      toast.error('Lütfen fiş numarası girin');
      return;
    }
    if (searchType === 'date' && (!dateFrom || !dateTo)) {
      toast.error('Lütfen tarih aralığı seçin');
      return;
    }

    setIsSearching(true);
    try {
      let response;
      if (searchType === 'receipt') {
        // Search by receipt number
        response = await api.get(`/sales/receipt/${receiptNumber}`);
        setSearchResults(response.data ? [response.data] : []);
      } else {
        // Search by date range
        response = await api.get('/sales/search', {
          params: {
            dateFrom,
            dateTo,
          }
        });
        setSearchResults(response.data || []);
      }

      if (searchResults.length === 0) {
        toast.error('Satış bulunamadı');
      }
    } catch (error: any) {
      console.error('Sale search error:', error);
      toast.error(error.response?.data?.message || 'Satış arama hatası');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    // Initialize return items map
    const newReturnItems = new Map<string, ReturnItem>();
    sale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: 0,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const handleUpdateReturnQuantity = (saleItemId: string, quantity: number) => {
    const item = returnItems.get(saleItemId);
    if (!item) return;

    const clampedQuantity = Math.max(0, Math.min(quantity, item.maxQuantity));
    const newReturnItems = new Map(returnItems);
    newReturnItems.set(saleItemId, {
      ...item,
      quantity: clampedQuantity,
    });
    setReturnItems(newReturnItems);
  };

  const handleSelectAllItems = () => {
    if (!selectedSale) return;
    const newReturnItems = new Map<string, ReturnItem>();
    selectedSale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: item.quantity,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const handleClearSelection = () => {
    if (!selectedSale) return;
    const newReturnItems = new Map<string, ReturnItem>();
    selectedSale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: 0,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const calculateReturnTotal = (): number => {
    if (!selectedSale) return 0;
    let total = 0;
    selectedSale.items.forEach(item => {
      const returnItem = returnItems.get(item.id);
      if (returnItem && returnItem.quantity > 0) {
        total += item.price * returnItem.quantity;
      }
    });
    return total;
  };

  const handleProcessReturn = async () => {
    if (!selectedSale) return;

    const itemsToReturn = Array.from(returnItems.values()).filter(item => item.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Lütfen iade edilecek ürünleri seçin');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post('/sales/return', {
        saleId: selectedSale.id,
        items: itemsToReturn.map(item => ({
          saleItemId: item.saleItemId,
          quantity: item.quantity,
        })),
      });

      toast.success(`İade işlemi başarılı! Toplam: ₺${calculateReturnTotal().toFixed(2)}`);
      onReturnComplete();
      onClose();
    } catch (error: any) {
      console.error('Return process error:', error);
      toast.error(error.response?.data?.message || 'İade işlemi başarısız');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="İade İşlemi"
      size="large"
    >
      <div className="space-y-4">
        {/* Search Section */}
        {!selectedSale && (
          <>
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <FluentButton
                appearance={searchType === 'receipt' ? 'primary' : 'subtle'}
                onClick={() => setSearchType('receipt')}
                icon={<Search className="w-4 h-4" />}
                size="small"
              >
                Fiş No
              </FluentButton>
              <FluentButton
                appearance={searchType === 'date' ? 'primary' : 'subtle'}
                onClick={() => setSearchType('date')}
                icon={<Calendar className="w-4 h-4" />}
                size="small"
              >
                Tarih
              </FluentButton>
            </div>

            {searchType === 'receipt' ? (
              <div className="flex gap-2">
                <FluentInput
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Fiş numarasını girin..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                <FluentButton
                  appearance="primary"
                  onClick={handleSearch}
                  disabled={isSearching}
                  icon={<Search className="w-4 h-4" />}
                >
                  {isSearching ? 'Aranıyor...' : 'Ara'}
                </FluentButton>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="fluent-caption font-medium text-foreground block mb-1.5">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="fluent-caption font-medium text-foreground block mb-1.5">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <FluentButton
                  appearance="primary"
                  onClick={handleSearch}
                  disabled={isSearching}
                  icon={<Search className="w-4 h-4" />}
                  className="w-full"
                >
                  {isSearching ? 'Aranıyor...' : 'Ara'}
                </FluentButton>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-md p-3">
                <p className="fluent-caption font-semibold text-foreground-secondary">
                  {searchResults.length} satış bulundu
                </p>
                {searchResults.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => handleSelectSale(sale)}
                    className={cn(
                      'p-3 border-2 rounded-md cursor-pointer transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      'border-border bg-background'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="fluent-body font-semibold text-foreground">
                          Fiş No: {sale.receiptNumber}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          {new Date(sale.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="fluent-body-large font-bold text-primary">
                          ₺{sale.total.toFixed(2)}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                    {sale.customer && (
                      <div className="flex items-center gap-1 text-foreground-secondary">
                        <User className="w-3 h-3" />
                        <span className="fluent-caption">{sale.customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-foreground-secondary mt-1">
                      <Package className="w-3 h-3" />
                      <span className="fluent-caption">{sale.items.length} ürün</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Return Details Section */}
        {selectedSale && (
          <div className="space-y-4">
            {/* Sale Header */}
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div>
                <p className="fluent-title-3 text-foreground">
                  Fiş No: {selectedSale.receiptNumber}
                </p>
                <p className="fluent-caption text-foreground-secondary">
                  {new Date(selectedSale.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              <FluentButton
                appearance="subtle"
                onClick={() => setSelectedSale(null)}
                size="small"
              >
                Geri Dön
              </FluentButton>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <FluentButton
                appearance="default"
                onClick={handleSelectAllItems}
                icon={<CheckCircle2 className="w-4 h-4" />}
                size="small"
              >
                Tümünü Seç
              </FluentButton>
              <FluentButton
                appearance="subtle"
                onClick={handleClearSelection}
                icon={<XCircle className="w-4 h-4" />}
                size="small"
              >
                Temizle
              </FluentButton>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-md p-3">
              {selectedSale.items.map((item) => {
                const returnItem = returnItems.get(item.id);
                if (!returnItem) return null;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 border-2 rounded-md transition-all',
                      returnItem.quantity > 0
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="fluent-body font-semibold text-foreground">
                          {item.productName}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          Barkod: {item.barcode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="fluent-body font-medium text-foreground">
                          ₺{item.price.toFixed(2)} x {item.quantity}
                        </p>
                        <p className="fluent-body-small font-bold text-primary">
                          ₺{item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="fluent-caption font-medium text-foreground">
                        İade Adedi:
                      </label>
                      <div className="flex items-center gap-2">
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          onClick={() => handleUpdateReturnQuantity(item.id, returnItem.quantity - 1)}
                          disabled={returnItem.quantity <= 0}
                        >
                          -
                        </FluentButton>
                        <input
                          type="number"
                          min="0"
                          max={returnItem.maxQuantity}
                          value={returnItem.quantity}
                          onChange={(e) => handleUpdateReturnQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center bg-background border border-border rounded fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          onClick={() => handleUpdateReturnQuantity(item.id, returnItem.quantity + 1)}
                          disabled={returnItem.quantity >= returnItem.maxQuantity}
                        >
                          +
                        </FluentButton>
                        <span className="fluent-caption text-foreground-secondary ml-2">
                          (Max: {returnItem.maxQuantity})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Return Summary */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between fluent-body font-medium text-foreground">
                <span>Orijinal Toplam:</span>
                <span>₺{selectedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between fluent-title-2 font-bold text-destructive">
                <span>İade Tutarı:</span>
                <span>₺{calculateReturnTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={onClose}
              >
                İptal
              </FluentButton>
              <FluentButton
                appearance="primary"
                className="flex-1"
                onClick={handleProcessReturn}
                disabled={isProcessing || calculateReturnTotal() === 0}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                {isProcessing ? 'İşleniyor...' : 'İade İşlemini Tamamla'}
              </FluentButton>
            </div>
          </div>
        )}
      </div>
    </FluentDialog>
  );
};

export default ReturnDialog;


import FluentDialog from '../fluent/FluentDialog';
import FluentInput from '../fluent/FluentInput';
import FluentButton from '../fluent/FluentButton';
import { Search, RotateCcw, Package, Calendar, User, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface Sale {
  id: string;
  receiptNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
  } | null;
  items: SaleItem[];
}

interface SaleItem {
  id: string;
  productId: string;
  barcode: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReturnItem {
  saleItemId: string;
  quantity: number;
  maxQuantity: number;
}

interface ReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onReturnComplete: () => void;
}

const ReturnDialog: React.FC<ReturnDialogProps> = ({ open, onClose, onReturnComplete }) => {
  const [searchType, setSearchType] = useState<'receipt' | 'date'>('receipt');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<Map<string, ReturnItem>>(new Map());
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset all states when dialog closes
      setSearchType('receipt');
      setReceiptNumber('');
      setDateFrom('');
      setDateTo('');
      setSearchResults([]);
      setSelectedSale(null);
      setReturnItems(new Map());
      setIsSearching(false);
      setIsProcessing(false);
    } else {
      // Set today's date as default for date search
      const today = new Date().toISOString().split('T')[0];
      setDateFrom(today);
      setDateTo(today);
    }
  }, [open]);

  const handleSearch = async () => {
    if (searchType === 'receipt' && !receiptNumber.trim()) {
      toast.error('Lütfen fiş numarası girin');
      return;
    }
    if (searchType === 'date' && (!dateFrom || !dateTo)) {
      toast.error('Lütfen tarih aralığı seçin');
      return;
    }

    setIsSearching(true);
    try {
      let response;
      if (searchType === 'receipt') {
        // Search by receipt number
        response = await api.get(`/sales/receipt/${receiptNumber}`);
        setSearchResults(response.data ? [response.data] : []);
      } else {
        // Search by date range
        response = await api.get('/sales/search', {
          params: {
            dateFrom,
            dateTo,
          }
        });
        setSearchResults(response.data || []);
      }

      if (searchResults.length === 0) {
        toast.error('Satış bulunamadı');
      }
    } catch (error: any) {
      console.error('Sale search error:', error);
      toast.error(error.response?.data?.message || 'Satış arama hatası');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    // Initialize return items map
    const newReturnItems = new Map<string, ReturnItem>();
    sale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: 0,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const handleUpdateReturnQuantity = (saleItemId: string, quantity: number) => {
    const item = returnItems.get(saleItemId);
    if (!item) return;

    const clampedQuantity = Math.max(0, Math.min(quantity, item.maxQuantity));
    const newReturnItems = new Map(returnItems);
    newReturnItems.set(saleItemId, {
      ...item,
      quantity: clampedQuantity,
    });
    setReturnItems(newReturnItems);
  };

  const handleSelectAllItems = () => {
    if (!selectedSale) return;
    const newReturnItems = new Map<string, ReturnItem>();
    selectedSale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: item.quantity,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const handleClearSelection = () => {
    if (!selectedSale) return;
    const newReturnItems = new Map<string, ReturnItem>();
    selectedSale.items.forEach(item => {
      newReturnItems.set(item.id, {
        saleItemId: item.id,
        quantity: 0,
        maxQuantity: item.quantity,
      });
    });
    setReturnItems(newReturnItems);
  };

  const calculateReturnTotal = (): number => {
    if (!selectedSale) return 0;
    let total = 0;
    selectedSale.items.forEach(item => {
      const returnItem = returnItems.get(item.id);
      if (returnItem && returnItem.quantity > 0) {
        total += item.price * returnItem.quantity;
      }
    });
    return total;
  };

  const handleProcessReturn = async () => {
    if (!selectedSale) return;

    const itemsToReturn = Array.from(returnItems.values()).filter(item => item.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Lütfen iade edilecek ürünleri seçin');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post('/sales/return', {
        saleId: selectedSale.id,
        items: itemsToReturn.map(item => ({
          saleItemId: item.saleItemId,
          quantity: item.quantity,
        })),
      });

      toast.success(`İade işlemi başarılı! Toplam: ₺${calculateReturnTotal().toFixed(2)}`);
      onReturnComplete();
      onClose();
    } catch (error: any) {
      console.error('Return process error:', error);
      toast.error(error.response?.data?.message || 'İade işlemi başarısız');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="İade İşlemi"
      size="large"
    >
      <div className="space-y-4">
        {/* Search Section */}
        {!selectedSale && (
          <>
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <FluentButton
                appearance={searchType === 'receipt' ? 'primary' : 'subtle'}
                onClick={() => setSearchType('receipt')}
                icon={<Search className="w-4 h-4" />}
                size="small"
              >
                Fiş No
              </FluentButton>
              <FluentButton
                appearance={searchType === 'date' ? 'primary' : 'subtle'}
                onClick={() => setSearchType('date')}
                icon={<Calendar className="w-4 h-4" />}
                size="small"
              >
                Tarih
              </FluentButton>
            </div>

            {searchType === 'receipt' ? (
              <div className="flex gap-2">
                <FluentInput
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Fiş numarasını girin..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                <FluentButton
                  appearance="primary"
                  onClick={handleSearch}
                  disabled={isSearching}
                  icon={<Search className="w-4 h-4" />}
                >
                  {isSearching ? 'Aranıyor...' : 'Ara'}
                </FluentButton>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="fluent-caption font-medium text-foreground block mb-1.5">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="fluent-caption font-medium text-foreground block mb-1.5">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <FluentButton
                  appearance="primary"
                  onClick={handleSearch}
                  disabled={isSearching}
                  icon={<Search className="w-4 h-4" />}
                  className="w-full"
                >
                  {isSearching ? 'Aranıyor...' : 'Ara'}
                </FluentButton>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-md p-3">
                <p className="fluent-caption font-semibold text-foreground-secondary">
                  {searchResults.length} satış bulundu
                </p>
                {searchResults.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => handleSelectSale(sale)}
                    className={cn(
                      'p-3 border-2 rounded-md cursor-pointer transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      'border-border bg-background'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="fluent-body font-semibold text-foreground">
                          Fiş No: {sale.receiptNumber}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          {new Date(sale.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="fluent-body-large font-bold text-primary">
                          ₺{sale.total.toFixed(2)}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                    {sale.customer && (
                      <div className="flex items-center gap-1 text-foreground-secondary">
                        <User className="w-3 h-3" />
                        <span className="fluent-caption">{sale.customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-foreground-secondary mt-1">
                      <Package className="w-3 h-3" />
                      <span className="fluent-caption">{sale.items.length} ürün</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Return Details Section */}
        {selectedSale && (
          <div className="space-y-4">
            {/* Sale Header */}
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div>
                <p className="fluent-title-3 text-foreground">
                  Fiş No: {selectedSale.receiptNumber}
                </p>
                <p className="fluent-caption text-foreground-secondary">
                  {new Date(selectedSale.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
              <FluentButton
                appearance="subtle"
                onClick={() => setSelectedSale(null)}
                size="small"
              >
                Geri Dön
              </FluentButton>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <FluentButton
                appearance="default"
                onClick={handleSelectAllItems}
                icon={<CheckCircle2 className="w-4 h-4" />}
                size="small"
              >
                Tümünü Seç
              </FluentButton>
              <FluentButton
                appearance="subtle"
                onClick={handleClearSelection}
                icon={<XCircle className="w-4 h-4" />}
                size="small"
              >
                Temizle
              </FluentButton>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-md p-3">
              {selectedSale.items.map((item) => {
                const returnItem = returnItems.get(item.id);
                if (!returnItem) return null;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 border-2 rounded-md transition-all',
                      returnItem.quantity > 0
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="fluent-body font-semibold text-foreground">
                          {item.productName}
                        </p>
                        <p className="fluent-caption text-foreground-secondary">
                          Barkod: {item.barcode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="fluent-body font-medium text-foreground">
                          ₺{item.price.toFixed(2)} x {item.quantity}
                        </p>
                        <p className="fluent-body-small font-bold text-primary">
                          ₺{item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="fluent-caption font-medium text-foreground">
                        İade Adedi:
                      </label>
                      <div className="flex items-center gap-2">
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          onClick={() => handleUpdateReturnQuantity(item.id, returnItem.quantity - 1)}
                          disabled={returnItem.quantity <= 0}
                        >
                          -
                        </FluentButton>
                        <input
                          type="number"
                          min="0"
                          max={returnItem.maxQuantity}
                          value={returnItem.quantity}
                          onChange={(e) => handleUpdateReturnQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center bg-background border border-border rounded fluent-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <FluentButton
                          appearance="subtle"
                          size="small"
                          onClick={() => handleUpdateReturnQuantity(item.id, returnItem.quantity + 1)}
                          disabled={returnItem.quantity >= returnItem.maxQuantity}
                        >
                          +
                        </FluentButton>
                        <span className="fluent-caption text-foreground-secondary ml-2">
                          (Max: {returnItem.maxQuantity})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Return Summary */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between fluent-body font-medium text-foreground">
                <span>Orijinal Toplam:</span>
                <span>₺{selectedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between fluent-title-2 font-bold text-destructive">
                <span>İade Tutarı:</span>
                <span>₺{calculateReturnTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <FluentButton
                appearance="subtle"
                className="flex-1"
                onClick={onClose}
              >
                İptal
              </FluentButton>
              <FluentButton
                appearance="primary"
                className="flex-1"
                onClick={handleProcessReturn}
                disabled={isProcessing || calculateReturnTotal() === 0}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                {isProcessing ? 'İşleniyor...' : 'İade İşlemini Tamamla'}
              </FluentButton>
            </div>
          </div>
        )}
      </div>
    </FluentDialog>
  );
};

export default ReturnDialog;



