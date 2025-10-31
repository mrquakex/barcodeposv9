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

const userSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  name: z.string().min(1, "İsim gereklidir").min(2, "İsim en az 2 karakter olmalıdır"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "CASHIER"]).default("CASHIER"),
  tenantId: z.string().optional(),
  isActive: z.boolean().default(true),
})

type UserFormData = z.infer<typeof userSchema>

interface UserCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserCreateModal({
  open,
  onOpenChange,
}: UserCreateModalProps) {
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
      email: "",
      password: "",
      name: "",
      role: "CASHIER",
      tenantId: "",
      isActive: true,
    },
  })

  const isActive = watch("isActive")
  const role = watch("role")

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload: any = {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      }
      if (data.tenantId) payload.tenantId = data.tenantId
      
      const response = await api.post("/users", payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Kullanıcı başarıyla oluşturuldu")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Kullanıcı oluşturulurken bir hata oluştu")
    },
  })

  const onSubmit = (data: UserFormData) => {
    createMutation.mutate(data)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir kullanıcı oluşturun. E-posta, şifre ve isim zorunludur.
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
              <Label htmlFor="password">Şifre *</Label>
              <Input
                id="password"
                type="password"
                placeholder="En az 6 karakter"
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
                onValueChange={(value) => setValue("tenantId", value)}
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
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

