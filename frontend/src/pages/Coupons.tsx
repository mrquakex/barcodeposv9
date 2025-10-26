import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Coupon } from '../types';
import api from '../lib/api';
import { Plus, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/campaigns/coupons');
      setCoupons(response.data.coupons);
    } catch (error) {
      toast.error('Kuponlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Kuponlar</h1><p className="text-muted-foreground mt-1">İndirim kuponları yönetimi</p></div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Yeni Kupon</Button>
      </motion.div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>İndirim</TableHead><TableHead>Kullanım</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
            <TableBody>
              {coupons.map(coupon => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>{coupon.discountType === 'PERCENTAGE' ? `%${coupon.discountValue}` : `₺${coupon.discountValue}`}</TableCell>
                  <TableCell>{coupon.usedCount} / {coupon.maxUses || '∞'}</TableCell>
                  <TableCell>{coupon.isActive ? <span className="text-green-600">● Aktif</span> : <span className="text-gray-600">○ Pasif</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Coupons;


