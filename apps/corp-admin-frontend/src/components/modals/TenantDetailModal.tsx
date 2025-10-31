import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Package, Key, CreditCard, Edit } from "lucide-react"
import { formatDate, formatNumber } from "@/lib/utils"
import { Tenant } from "@/hooks/useTenants"

interface TenantDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
  onEdit?: (tenant: Tenant) => void
}

export function TenantDetailModal({
  open,
  onOpenChange,
  tenant,
  onEdit,
}: TenantDetailModalProps) {
  if (!tenant) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {tenant.name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Tenant detay bilgileri ve istatistikleri
              </DialogDescription>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(tenant)}>
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="licenses">Lisanslar</TabsTrigger>
            <TabsTrigger value="payments">Ödemeler</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tenant ID</p>
                <p className="font-mono text-sm">{tenant.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Durum</p>
                {tenant.isActive ? (
                  <Badge variant="success">Aktif</Badge>
                ) : (
                  <Badge variant="destructive">Pasif</Badge>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Oluşturulma</p>
                <p className="text-sm">{formatDate(tenant.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Kullanıcılar</p>
                </div>
                <p className="text-2xl font-bold">{formatNumber(tenant.userCount)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Ürünler</p>
                </div>
                <p className="text-2xl font-bold">{formatNumber(tenant.productCount)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Lisanslar</p>
                </div>
                <p className="text-2xl font-bold">{formatNumber(tenant.licenseCount)}</p>
              </div>
            </div>

            {tenant.activeLicense && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktif Lisans</p>
                    <p className="text-lg font-semibold">{tenant.activeLicense.plan}</p>
                  </div>
                  {tenant.activeLicense.expiresAt && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Bitiş Tarihi</p>
                      <p className="text-sm">{formatDate(tenant.activeLicense.expiresAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div className="text-center py-8 text-muted-foreground">
              Kullanıcı listesi yakında eklenecek
            </div>
          </TabsContent>

          <TabsContent value="licenses">
            <div className="text-center py-8 text-muted-foreground">
              Lisans listesi yakında eklenecek
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="text-center py-8 text-muted-foreground">
              Ödeme geçmişi yakında eklenecek
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

