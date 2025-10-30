import React, { useState, useEffect } from 'react';
import { Shield, CreditCard, FileText, CheckCircle, XCircle, Clock, Save, Eye } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentInput from '../components/fluent/FluentInput';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface IBANSettings {
  bankName: string;
  iban: string;
  accountHolder: string;
  instructions: string;
  currency: string;
  fastQrUrl?: string;
}

interface PaymentReceipt {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  bankName?: string;
  iban?: string;
  reference?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proofUrl?: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  tenant?: {
    id: string;
    name: string;
  };
}

interface License {
  id: string;
  tenantId: string;
  status: string;
  plan: string;
  includesMobile: boolean;
  trial: boolean;
  trialEndsAt?: string;
  startsAt: string;
  expiresAt?: string;
  notes?: string;
  tenant?: {
    id: string;
    name: string;
  };
}

const SuperAdminPanel: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Redirect if not super admin (allow special bootstrap account)
  useEffect(() => {
    // wait until user is loaded; avoid false denial on initial mount
    if (user === null || user === undefined) return;
    const allowed = user.isSuperAdmin || user.email === 'superadmin@barcodepos.trade';
    if (!allowed) {
      navigate('/dashboard');
      toast.error('Bu sayfaya erişim yetkiniz yok');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<'iban' | 'receipts' | 'licenses'>('iban');
  const [ibanSettings, setIbanSettings] = useState<IBANSettings>({
    bankName: '',
    iban: '',
    accountHolder: '',
    instructions: '',
    currency: 'TRY',
    fastQrUrl: ''
  });
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionData, setDecisionData] = useState({
    decision: 'APPROVED' as 'APPROVED' | 'REJECTED',
    licenseType: 'STANDARD',
    licenseDurationDays: 30,
    notes: ''
  });

  useEffect(() => {
    if (user?.isSuperAdmin) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'iban') {
        const res = await api.get('/admin/iban-settings');
        if (res.data.ibanSettings) {
          setIbanSettings(res.data.ibanSettings);
        }
      } else if (activeTab === 'receipts') {
        const res = await api.get('/admin/payment-receipts');
        setReceipts(res.data.receipts || []);
      } else if (activeTab === 'licenses') {
        const res = await api.get('/admin/licenses');
        setLicenses(res.data.licenses || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIBAN = async () => {
    setSaving(true);
    try {
      await api.post('/admin/iban-settings', ibanSettings);
      toast.success('IBAN ayarları kaydedildi');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleReceiptDecision = async () => {
    if (!selectedReceipt) return;
    setSaving(true);
    try {
      await api.post(`/admin/payment-receipts/${selectedReceipt.id}/decision`, decisionData);
      toast.success(`Dekont ${decisionData.decision === 'APPROVED' ? 'onaylandı' : 'reddedildi'}`);
      setDecisionModalOpen(false);
      setSelectedReceipt(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  // while user is loading, render nothing to prevent flicker
  if (user === null || user === undefined) return null;
  const allowed = user.isSuperAdmin || user.email === 'superadmin@barcodepos.trade';
  if (!allowed) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="fluent-title text-foreground flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Süper Admin Paneli
        </h1>
        <p className="fluent-body text-foreground-secondary mt-2">
          IBAN ayarları, ödeme dekontları ve lisans yönetimi
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: 'iban', label: 'IBAN Ayarları', icon: CreditCard },
          { id: 'receipts', label: 'Ödeme Dekontları', icon: FileText },
          { id: 'licenses', label: 'Lisans Yönetimi', icon: Shield }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* IBAN Settings Tab */}
      {activeTab === 'iban' && (
        <FluentCard className="p-6">
          <h3 className="fluent-heading text-foreground mb-4">IBAN Bilgileri</h3>
          <div className="space-y-4">
            <FluentInput
              label="Banka Adı"
              value={ibanSettings.bankName}
              onChange={(e) => setIbanSettings({ ...ibanSettings, bankName: e.target.value })}
            />
            <FluentInput
              label="IBAN"
              value={ibanSettings.iban}
              onChange={(e) => setIbanSettings({ ...ibanSettings, iban: e.target.value })}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
            <FluentInput
              label="Hesap Sahibi"
              value={ibanSettings.accountHolder}
              onChange={(e) => setIbanSettings({ ...ibanSettings, accountHolder: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ödeme Açıklaması Formatı
              </label>
              <textarea
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                value={ibanSettings.instructions}
                onChange={(e) => setIbanSettings({ ...ibanSettings, instructions: e.target.value })}
                placeholder="Örnek: BarcodePOS Lisans - [KULLANICI_EMAIL]"
              />
            </div>
            <FluentInput
              label="Para Birimi"
              value={ibanSettings.currency}
              onChange={(e) => setIbanSettings({ ...ibanSettings, currency: e.target.value })}
            />
            <FluentInput
              label="QR Kod URL (Opsiyonel)"
              value={ibanSettings.fastQrUrl || ''}
              onChange={(e) => setIbanSettings({ ...ibanSettings, fastQrUrl: e.target.value })}
              placeholder="https://..."
            />
            <FluentButton
              appearance="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveIBAN}
              loading={saving}
            >
              Kaydet
            </FluentButton>
          </div>
        </FluentCard>
      )}

      {/* Payment Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : receipts.length === 0 ? (
            <FluentCard className="p-10 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
              <p className="text-lg font-semibold text-foreground">Henüz ödeme dekontu yok</p>
            </FluentCard>
          ) : (
            receipts.map((receipt) => (
              <FluentCard key={receipt.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">
                        {receipt.tenant?.name || 'Bilinmeyen Tenant'}
                      </h4>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          receipt.status === 'APPROVED'
                            ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                            : receipt.status === 'REJECTED'
                            ? 'bg-red-500/10 text-red-600 border border-red-500/30'
                            : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30'
                        }`}
                      >
                        {receipt.status === 'PENDING' && <Clock className="w-3 h-3 inline mr-1" />}
                        {receipt.status === 'APPROVED' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {receipt.status === 'REJECTED' && <XCircle className="w-3 h-3 inline mr-1" />}
                        {receipt.status === 'PENDING' ? 'Beklemede' : receipt.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Tutar: {receipt.amount} {receipt.currency}
                    </p>
                    {receipt.reference && (
                      <p className="text-sm text-foreground-secondary">Referans: {receipt.reference}</p>
                    )}
                    <p className="text-xs text-foreground-secondary mt-2">
                      {new Date(receipt.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {receipt.status === 'PENDING' && (
                    <FluentButton
                      appearance="primary"
                      size="small"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setDecisionModalOpen(true);
                      }}
                    >
                      İncele
                    </FluentButton>
                  )}
                </div>
              </FluentCard>
            ))
          )}
        </div>
      )}

      {/* Licenses Tab */}
      {activeTab === 'licenses' && (
        <FluentCard className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : licenses.length === 0 ? (
            <div className="p-10 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
              <p className="text-lg font-semibold text-foreground">Henüz lisans yok</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Tenant</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Plan</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Durum</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Başlangıç</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Bitiş</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Mobil</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-b border-border hover:bg-card-hover">
                    <td className="p-3 text-sm text-foreground">{license.tenant?.name || 'Bilinmeyen'}</td>
                    <td className="p-3 text-sm text-foreground">{license.plan}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          license.status === 'ACTIVE'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {license.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-foreground-secondary">
                      {new Date(license.startsAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-3 text-sm text-foreground-secondary">
                      {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="p-3">
                      {license.includesMobile ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </FluentCard>
      )}

      {/* Decision Modal */}
      {decisionModalOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <FluentCard className="p-6 max-w-md w-full mx-4">
            <h3 className="fluent-heading text-foreground mb-4">Dekont Kararı</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Karar</label>
                <select
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground"
                  value={decisionData.decision}
                  onChange={(e) => setDecisionData({ ...decisionData, decision: e.target.value as any })}
                >
                  <option value="APPROVED">Onayla</option>
                  <option value="REJECTED">Reddet</option>
                </select>
              </div>
              {decisionData.decision === 'APPROVED' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Lisans Türü</label>
                    <select
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground"
                      value={decisionData.licenseType}
                      onChange={(e) => setDecisionData({ ...decisionData, licenseType: e.target.value })}
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                  <FluentInput
                    label="Lisans Süresi (Gün)"
                    type="number"
                    value={decisionData.licenseDurationDays.toString()}
                    onChange={(e) => setDecisionData({ ...decisionData, licenseDurationDays: parseInt(e.target.value) || 30 })}
                  />
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notlar</label>
                <textarea
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground"
                  rows={3}
                  value={decisionData.notes}
                  onChange={(e) => setDecisionData({ ...decisionData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <FluentButton
                  appearance="primary"
                  onClick={handleReceiptDecision}
                  loading={saving}
                  className="flex-1"
                >
                  {decisionData.decision === 'APPROVED' ? 'Onayla' : 'Reddet'}
                </FluentButton>
                <FluentButton
                  appearance="subtle"
                  onClick={() => {
                    setDecisionModalOpen(false);
                    setSelectedReceipt(null);
                  }}
                  className="flex-1"
                >
                  İptal
                </FluentButton>
              </div>
            </div>
          </FluentCard>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPanel;

