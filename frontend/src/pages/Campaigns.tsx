import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Campaign } from '../types';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data.campaigns);
    } catch (error) {
      toast.error('Kampanyalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Kampanyalar</h1><p className="text-muted-foreground mt-1">İndirim ve promosyon yönetimi</p></div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Yeni Kampanya</Button>
      </motion.div>

      <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-purple-50/20 to-blue-50 dark:from-slate-900 dark:via-purple-950/20 dark:to-blue-950/20 group">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-600 to-blue-600" />
        
        {/* Glassmorphism overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className="p-6 relative">
          <Table>
            <TableHeader><TableRow><TableHead>Kampanya</TableHead><TableHead>Tip</TableHead><TableHead>İndirim</TableHead><TableHead>Başlangıç</TableHead><TableHead>Bitiş</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
            <TableBody>
              {campaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell><span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs">{campaign.type}</span></TableCell>
                  <TableCell>{campaign.discountValue ? `${campaign.discountType === 'PERCENTAGE' ? '%' : '₺'}${campaign.discountValue}` : '-'}</TableCell>
                  <TableCell className="text-sm">{formatDate(campaign.startDate)}</TableCell>
                  <TableCell className="text-sm">{formatDate(campaign.endDate)}</TableCell>
                  <TableCell>{campaign.isActive ? <span className="text-green-600">● Aktif</span> : <span className="text-gray-600">○ Pasif</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campaigns;


