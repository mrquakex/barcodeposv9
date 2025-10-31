import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'İsim en az 2 karakter olmalı.' }),
  email: z.string().email({ message: 'Geçerli bir email adresi girin.' }),
  role: z.enum(['CORP_ADMIN', 'CORP_OPS', 'CORP_SUPPORT']),
  isActive: z.boolean(),
  password: z.string().optional(),
});

type AdminFormData = z.infer<typeof formSchema>;

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface AdminEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin | null;
}

export const AdminEditModal: React.FC<AdminEditModalProps> = ({ open, onOpenChange, admin }) => {
  const queryClient = useQueryClient();
  const form = useForm<AdminFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'CORP_SUPPORT',
      isActive: true,
      password: '',
    },
  });

  useEffect(() => {
    if (admin) {
      form.reset({
        name: admin.name,
        email: admin.email,
        role: admin.role as any,
        isActive: admin.isActive,
        password: '',
      });
    }
  }, [admin, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: AdminFormData) => {
      if (!admin) throw new Error('Admin not selected');
      const updateData: any = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      const response = await api.patch(`/admin-management/${admin.id}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Admin başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Admin güncellenirken bir hata oluştu');
    },
  });

  const onSubmit = (values: AdminFormData) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Admin Düzenle</DialogTitle>
          <DialogDescription>
            Admin bilgilerini düzenleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">İsim</Label>
            <Input
              id="name"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Yeni Şifre (Opsiyonel)</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              placeholder="Değiştirmek istemiyorsanız boş bırakın"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={form.watch('role')}
              onValueChange={(value) => form.setValue('role', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORP_ADMIN">Admin</SelectItem>
                <SelectItem value="CORP_OPS">Operasyon</SelectItem>
                <SelectItem value="CORP_SUPPORT">Destek</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked as boolean)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">Aktif</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

