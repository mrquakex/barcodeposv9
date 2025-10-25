import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Shield, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/activity-logs');
      setLogs(response.data.logs);
    } catch (error) {
      toast.error('Loglar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: any = { CREATE: 'text-green-600', UPDATE: 'text-blue-600', DELETE: 'text-red-600', LOGIN: 'text-purple-600', LOGOUT: 'text-gray-600' };
    return colors[action] || 'text-gray-600';
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Aktivite Logları</h1>
        <p className="text-muted-foreground mt-1">Sistem kullanım geçmişi</p>
      </motion.div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Kullanıcı</TableHead><TableHead>İşlem</TableHead><TableHead>Modül</TableHead><TableHead>Açıklama</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{formatDate(log.createdAt)}</TableCell>
                  <TableCell>{log.user?.name || '-'}</TableCell>
                  <TableCell><span className={`font-semibold ${getActionColor(log.action)}`}>{log.action}</span></TableCell>
                  <TableCell><span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs">{log.module}</span></TableCell>
                  <TableCell className="text-sm">{log.description}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;

