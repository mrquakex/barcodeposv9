import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { User } from '../types';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, Shield, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Kullanıcı Yönetimi</h1><p className="text-muted-foreground mt-1">Sistem kullanıcıları ve yetkileri</p></div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Yeni Kullanıcı</Button>
      </motion.div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Kullanıcı</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead>Durum</TableHead><TableHead>Kayıt</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}`}>{user.role}</span></TableCell>
                  <TableCell>{user.isActive ? <span className="text-green-600">● Aktif</span> : <span className="text-red-600">○ Pasif</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;


