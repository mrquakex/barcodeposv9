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
import { Switch } from "@/components/ui/switch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Tenant } from "@/hooks/useTenants"

const tenantSchema = z.object({
  name: z.string().min(1, "Tenant adı gereklidir").min(3, "Tenant adı en az 3 karakter olmalıdır"),
  isActive: z.boolean().default(true),
})

type TenantFormData = z.infer<typeof tenantSchema>

interface TenantEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
}

export function TenantEditModal({
  open,
  onOpenChange,
  tenant,
}: TenantEditModalProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: tenant?.name || "",
      isActive: tenant?.isActive ?? true,
    },
  })

  React.useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        isActive: tenant.isActive,
      })
    }
  }, [tenant, reset])

  const isActive = watch("isActive")

  const updateMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const response = await api.patch(`/tenants/${tenant?.id}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success("Tenant başarıyla güncellendi")
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Tenant güncellenirken bir hata oluştu")
    },
  })

  const onSubmit = (data: TenantFormData) => {
    if (!tenant) return
    updateMutation.mutate(data)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      reset()
    }
    onOpenChange(newOpen)
  }

  if (!tenant) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Tenant Düzenle</DialogTitle>
            <DialogDescription>
              Tenant bilgilerini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Adı *</Label>
              <Input
                id="name"
                placeholder="Örn: ABC Mağazası"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Aktif Durumu</Label>
                <p className="text-sm text-muted-foreground">
                  Tenant aktif olduğunda kullanılabilir
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

