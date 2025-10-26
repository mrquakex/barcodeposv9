import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Branch } from '../types';
import api from '../lib/api';
import { Plus, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data.branches);
    } catch (error) {
      toast.error('Şubeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Şubeler</h1><p className="text-muted-foreground mt-1">Çoklu şube yönetimi</p></div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Yeni Şube</Button>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {branches.map((branch, index) => (
          <motion.div key={branch.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
            <Card className="glass card-hover">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center mb-4"><Building className="w-8 h-8 text-white" /></div>
                <h3 className="font-bold text-lg mb-1">{branch.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{branch.address}</p>
                <div className="flex items-center justify-between text-xs"><span>{branch.phone}</span>{branch.isActive ? <span className="text-green-600">● Aktif</span> : <span className="text-gray-600">○ Pasif</span>}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Branches;


