import React from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'İsim en az 2 karakter olmalı.' }),
  email: z.string().email({ message: 'Geçerli bir email adresi girin.' }),
  password: z.string().min(8, { message: 'Şifre en az 8 karakter olmalı.' }),
  role: z.enum(['CORP_ADMIN', 'CORP_OPS', 'CORP_SUPPORT']),
});

type AdminFormData = z.infer<typeof formSchema>;

interface AdminCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminCreateModal: React.FC<AdminCreateModalProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const form = useForm<AdminFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'CORP_SUPPORT',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AdminFormData) => {
      const response = await api.post('/admin-management', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Admin başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Admin oluşturulurken bir hata oluştu');
    },
  });

  const onSubmit = (values: AdminFormData) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Admin Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir sistem yöneticisi oluşturun
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
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
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
          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

