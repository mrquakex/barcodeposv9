import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useTenants } from "@/hooks/useTenants"
import { User } from "@/hooks/useUsers"

const userSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  name: z.string().min(1, "İsim gereklidir").min(2, "İsim en az 2 karakter olmalıdır"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "CASHIER"]).default("CASHIER"),
  tenantId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  password: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserEditModal({
  open,
  onOpenChange,
  user,
}: UserEditModalProps) {
  const queryClient = useQueryClient()
  const { data: tenantsData } = useTenants({ limit: 100 })
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || "",
      name: user?.name || "",
      role: (user?.role as any) || "CASHIER",
      tenantId: user?.tenant?.id || "",
      isActive: user?.isActive ?? true,
      password: "",
    },
  })

  React.useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        name: user.name,
        role: (user.role as any) || "CASHIER",
        tenantId: user.tenant?.id || "",
        isActive: user.isActive,
        password: "",
      })
    }
  }, [user, reset])

  const isActive = watch("isActive")
  const role = watch("role")

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload: any = {
        email: data.email,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      }
      if (data.tenantId) payload.tenantId = data.tenantId
      if (data.password && data.password.length > 0) payload.password = data.password
      
      const response = await api.patch(`/users/${user?.id}`, payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Kullanıcı başarıyla güncellendi")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Kullanıcı güncellenirken bir hata oluştu")
    },
  })

  const onSubmit = (data: UserFormData) => {
    if (!user) return
    updateMutation.mutate(data)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      reset()
    }
    onOpenChange(newOpen)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
            <DialogDescription>
              Kullanıcı bilgilerini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <Input
                id="email"
                type="email"
                placeholder="kullanici@example.com"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Yeni Şifre (Opsiyonel)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Değiştirmek istemiyorsanız boş bırakın"
                {...register("password")}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">İsim *</Label>
              <Input
                id="name"
                placeholder="Kullanıcı adı"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={role}
                onValueChange={(value) => setValue("role", value as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASHIER">Kasiyer</SelectItem>
                  <SelectItem value="MANAGER">Yönetici</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Süper Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant (Opsiyonel)</Label>
              <Select
                value={watch("tenantId") || ""}
                onValueChange={(value) => setValue("tenantId", value || null)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="tenantId">
                  <SelectValue placeholder="Tenant seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tenant yok</SelectItem>
                  {tenantsData?.tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Aktif Durumu</Label>
                <p className="text-sm text-muted-foreground">
                  Kullanıcı aktif olduğunda giriş yapabilir
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

