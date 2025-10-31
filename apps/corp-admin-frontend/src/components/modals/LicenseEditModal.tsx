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
import { License } from "@/hooks/useLicenses"

const licenseSchema = z.object({
  status: z.string().min(1, "Durum seçimi gereklidir"),
  plan: z.string().min(1, "Plan seçimi gereklidir"),
  includesMobile: z.boolean().default(false),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type LicenseFormData = z.infer<typeof licenseSchema>

interface LicenseEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  license: License | null
}

export function LicenseEditModal({
  open,
  onOpenChange,
  license,
}: LicenseEditModalProps) {
  const queryClient = useQueryClient()
  
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
      status: license?.status || "ACTIVE",
      plan: license?.plan || "STANDARD",
      includesMobile: license?.includesMobile || false,
      expiresAt: license?.expiresAt ? license.expiresAt.split('T')[0] + 'T' + license.expiresAt.split('T')[1].slice(0, 5) : "",
      notes: license?.notes || "",
    },
  })

  React.useEffect(() => {
    if (license) {
      reset({
        status: license.status,
        plan: license.plan,
        includesMobile: license.includesMobile,
        expiresAt: license.expiresAt ? license.expiresAt.substring(0, 16) : "",
        notes: license.notes || "",
      })
    }
  }, [license, reset])

  const updateMutation = useMutation({
    mutationFn: async (data: LicenseFormData) => {
      const payload: any = {
        status: data.status,
        plan: data.plan,
        includesMobile: data.includesMobile,
        notes: data.notes || undefined,
      }
      if (data.expiresAt) payload.expiresAt = data.expiresAt
      
      const response = await api.patch(`/licenses/${license?.id}`, payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Lisans başarıyla güncellendi")
      queryClient.invalidateQueries({ queryKey: ["licenses"] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Lisans güncellenirken bir hata oluştu")
    },
  })

  const onSubmit = (data: LicenseFormData) => {
    if (!license) return
    updateMutation.mutate(data)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      reset()
    }
    onOpenChange(newOpen)
  }

  if (!license) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Lisans Düzenle</DialogTitle>
            <DialogDescription>
              Lisans bilgilerini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Durum *</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="EXPIRED">Süresi Dolmuş</SelectItem>
                  <SelectItem value="SUSPENDED">Askıya Alınmış</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan *</Label>
              <Select
                value={watch("plan")}
                onValueChange={(value) => setValue("plan", value)}
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
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

