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
        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Kampanyalar</h1><p className="text-muted-foreground mt-1">İndirim ve promosyon yönetimi</p></div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Yeni Kampanya</Button>
      </motion.div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Kampanya</TableHead><TableHead>Tip</TableHead><TableHead>İndirim</TableHead><TableHead>Başlangıç</TableHead><TableHead>Bitiş</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
            <TableBody>
              {campaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell><span className="px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-xs">{campaign.type}</span></TableCell>
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

