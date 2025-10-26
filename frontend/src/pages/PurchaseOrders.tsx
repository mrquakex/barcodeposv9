import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { formatCurrency, formatDate } from '../lib/utils';
import { ShoppingBag } from 'lucide-react';

const PurchaseOrders: React.FC = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Satın Alma Siparişleri</h1>
        <p className="text-muted-foreground mt-1">Tedarikçi siparişlerinizi yönetin</p>
      </motion.div>
      <Card><CardContent className="p-12 text-center"><ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" /><p className="text-muted-foreground">Sipariş modülü yakında...</p></CardContent></Card>
    </div>
  );
};

export default PurchaseOrders;


