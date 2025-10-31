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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  role: z.string().min(1, { message: 'Rol seçilmelidir.' }),
});

type RoleFormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface UserRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const roles = ['ADMIN', 'USER', 'MANAGER', 'VIEWER'];

export const UserRoleModal: React.FC<UserRoleModalProps> = ({ open, onOpenChange, user }) => {
  const queryClient = useQueryClient();
  const form = useForm<RoleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user?.role || 'USER',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({ role: user.role || 'USER' });
    }
  }, [user, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      if (!user) throw new Error('User not selected');
      const response = await api.patch(`/users/${user.id}`, { role: data.role });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Kullanıcı rolü güncellendi');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Rol güncellenirken bir hata oluştu');
    },
  });

  const onSubmit = (values: RoleFormData) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kullanıcı Rolü Düzenle</DialogTitle>
          <DialogDescription>
            {user?.name} için rol belirleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={form.watch('role')}
              onValueChange={(value) => form.setValue('role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
            )}
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

