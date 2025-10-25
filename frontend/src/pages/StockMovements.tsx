import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { StockMovement } from '../types';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { TrendingUp, TrendingDown, ArrowLeftRight, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const StockMovements: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const response = await api.get('/stock/movements');
      setMovements(response.data.movements);
    } catch (error) {
      toast.error('Stok hareketleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'OUT': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'TRANSFER': return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
      default: return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeName = (type: string) => {
    const types: any = { IN: 'Giriş', OUT: 'Çıkış', TRANSFER: 'Transfer', ADJUSTMENT: 'Düzeltme' };
    return types[type] || type;
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Stok Hareketleri</h1>
        <p className="text-muted-foreground mt-1">Tüm stok giriş/çıkış kayıtları</p>
      </motion.div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tarih</TableHead><TableHead>Ürün</TableHead><TableHead>Tip</TableHead><TableHead>Miktar</TableHead><TableHead>Önceki</TableHead><TableHead>Yeni</TableHead><TableHead>Kullanıcı</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(movement => (
                <TableRow key={movement.id}>
                  <TableCell className="text-sm">{formatDate(movement.createdAt)}</TableCell>
                  <TableCell className="font-medium">{movement.product?.name}</TableCell>
                  <TableCell><div className="flex items-center gap-2">{getTypeIcon(movement.type)}<span>{getTypeName(movement.type)}</span></div></TableCell>
                  <TableCell className={movement.type === 'IN' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{movement.type === 'IN' ? '+' : '-'}{movement.quantity}</TableCell>
                  <TableCell>{movement.previousStock}</TableCell>
                  <TableCell className="font-semibold">{movement.newStock}</TableCell>
                  <TableCell>{movement.user?.name || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovements;

