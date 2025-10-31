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
import { Checkbox } from "@/components/ui/checkbox"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useTenants } from "@/hooks/useTenants"

const licenseSchema = z.object({
  tenantId: z.string().min(1, "Tenant seçimi gereklidir"),
  plan: z.string().min(1, "Plan seçimi gereklidir"),
  includesMobile: z.boolean().default(false),
  trial: z.boolean().default(false),
  trialEndsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
})

type LicenseFormData = z.infer<typeof licenseSchema>

interface LicenseCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LicenseCreateModal({
  open,
  onOpenChange,
}: LicenseCreateModalProps) {
  const queryClient = useQueryClient()
  const { data: tenantsData } = useTenants({ limit: 100 })
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      tenantId: "",
      plan: "STANDARD",
      includesMobile: false,
      trial: false,
      trialEndsAt: "",
      expiresAt: "",
      notes: "",
    },
  })

  const trial = watch("trial")

  const createMutation = useMutation({
    mutationFn: async (data: LicenseFormData) => {
      const payload: any = {
        tenantId: data.tenantId,
        plan: data.plan,
        includesMobile: data.includesMobile,
        trial: data.trial,
        notes: data.notes || undefined,
      }
      if (data.expiresAt) payload.expiresAt = data.expiresAt
      if (data.trial && data.trialEndsAt) payload.trialEndsAt = data.trialEndsAt
      
      const response = await api.post("/licenses", payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Lisans başarıyla oluşturuldu")
      queryClient.invalidateQueries({ queryKey: ["licenses"] })
      reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Lisans oluşturulurken bir hata oluştu")
    },
  })

  const onSubmit = (data: LicenseFormData) => {
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
            <DialogTitle>Yeni Lisans Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir lisans oluşturun. Tenant seçimi ve plan zorunludur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant *</Label>
              <Select
                onValueChange={(value) => setValue("tenantId", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="tenantId">
                  <SelectValue placeholder="Tenant seçin" />
                </SelectTrigger>
                <SelectContent>
                  {tenantsData?.tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenantId && (
                <p className="text-sm text-destructive">{errors.tenantId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan *</Label>
              <Select
                onValueChange={(value) => setValue("plan", value)}
                defaultValue="STANDARD"
                disabled={isSubmitting}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Plan seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              {errors.plan && (
                <p className="text-sm text-destructive">{errors.plan.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="includesMobile">Mobil Uygulama Dahil</Label>
                <p className="text-sm text-muted-foreground">
                  Lisans mobil uygulamayı içeriyor mu?
                </p>
              </div>
              <Switch
                id="includesMobile"
                checked={watch("includesMobile")}
                onCheckedChange={(checked) => setValue("includesMobile", checked)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="trial">Deneme Lisansı</Label>
                <p className="text-sm text-muted-foreground">
                  Bu bir deneme lisansı mı?
                </p>
              </div>
              <Switch
                id="trial"
                checked={trial}
                onCheckedChange={(checked) => setValue("trial", checked)}
                disabled={isSubmitting}
              />
            </div>

            {trial && (
              <div className="space-y-2">
                <Label htmlFor="trialEndsAt">Deneme Bitiş Tarihi</Label>
                <Input
                  id="trialEndsAt"
                  type="datetime-local"
                  {...register("trialEndsAt")}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Bitiş Tarihi (Opsiyonel)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                {...register("expiresAt")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Input
                id="notes"
                placeholder="Lisans hakkında notlar..."
                {...register("notes")}
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

