import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Code, Key, Globe, FileText } from 'lucide-react';

const ApiDocs: React.FC = () => {
  const apiEndpoints = [
    {
      category: 'Authentication',
      endpoints: [
        { method: 'POST', path: '/api/auth/login', description: 'Admin girişi' },
        { method: 'POST', path: '/api/auth/logout', description: 'Çıkış yap' },
        { method: 'GET', path: '/api/auth/me', description: 'Mevcut kullanıcı bilgisi' },
      ],
    },
    {
      category: 'Tenants',
      endpoints: [
        { method: 'GET', path: '/api/tenants', description: 'Tenant listesi' },
        { method: 'POST', path: '/api/tenants', description: 'Yeni tenant oluştur' },
        { method: 'GET', path: '/api/tenants/:id', description: 'Tenant detayı' },
        { method: 'PATCH', path: '/api/tenants/:id', description: 'Tenant güncelle' },
        { method: 'DELETE', path: '/api/tenants/:id', description: 'Tenant sil' },
      ],
    },
    {
      category: 'Licenses',
      endpoints: [
        { method: 'GET', path: '/api/licenses', description: 'Lisans listesi' },
        { method: 'POST', path: '/api/licenses', description: 'Yeni lisans oluştur' },
        { method: 'PATCH', path: '/api/licenses/:id', description: 'Lisans güncelle' },
        { method: 'DELETE', path: '/api/licenses/:id', description: 'Lisans sil' },
      ],
    },
    {
      category: 'Users',
      endpoints: [
        { method: 'GET', path: '/api/users', description: 'Kullanıcı listesi' },
        { method: 'POST', path: '/api/users', description: 'Yeni kullanıcı oluştur' },
        { method: 'PATCH', path: '/api/users/:id', description: 'Kullanıcı güncelle' },
        { method: 'DELETE', path: '/api/users/:id', description: 'Kullanıcı sil' },
      ],
    },
    {
      category: 'Analytics',
      endpoints: [
        { method: 'GET', path: '/api/analytics/revenue', description: 'Gelir analizi' },
        { method: 'GET', path: '/api/analytics/tenants', description: 'Tenant analizi' },
        { method: 'GET', path: '/api/analytics/users', description: 'Kullanıcı analizi' },
        { method: 'GET', path: '/api/metrics', description: 'İş metrikleri (MRR, CLV, vb.)' },
      ],
    },
    {
      category: 'Reports',
      endpoints: [
        { method: 'GET', path: '/api/reports/tenants', description: 'Tenant raporu' },
        { method: 'GET', path: '/api/reports/licenses', description: 'Lisans raporu' },
        { method: 'GET', path: '/api/reports/users', description: 'Kullanıcı raporu' },
        { method: 'GET', path: '/api/reports/financial', description: 'Finansal rapor' },
        { method: 'GET', path: '/api/reports/system', description: 'Sistem raporu' },
      ],
    },
    {
      category: 'Billing',
      endpoints: [
        { method: 'GET', path: '/api/billing/invoices', description: 'Fatura listesi' },
        { method: 'POST', path: '/api/billing/invoices', description: 'Fatura oluştur' },
        { method: 'GET', path: '/api/billing/payments', description: 'Ödeme listesi' },
      ],
    },
    {
      category: 'API Management',
      endpoints: [
        { method: 'GET', path: '/api/api-keys', description: 'API key listesi' },
        { method: 'POST', path: '/api/api-keys', description: 'Yeni API key oluştur' },
        { method: 'DELETE', path: '/api/api-keys/:id', description: 'API key sil' },
      ],
    },
    {
      category: 'Webhooks',
      endpoints: [
        { method: 'GET', path: '/api/webhooks', description: 'Webhook listesi' },
        { method: 'POST', path: '/api/webhooks', description: 'Webhook oluştur' },
        { method: 'PATCH', path: '/api/webhooks/:id', description: 'Webhook güncelle' },
        { method: 'DELETE', path: '/api/webhooks/:id', description: 'Webhook sil' },
        { method: 'POST', path: '/api/webhooks/:id/test', description: 'Webhook test et' },
      ],
    },
    {
      category: 'Security',
      endpoints: [
        { method: 'GET', path: '/api/security-audit', description: 'Güvenlik denetim logları' },
        { method: 'POST', path: '/api/mfa/setup', description: 'MFA kurulumu' },
        { method: 'POST', path: '/api/mfa/verify', description: 'MFA doğrulama' },
        { method: 'GET', path: '/api/sessions', description: 'Aktif oturumlar' },
      ],
    },
    {
      category: 'Data Operations',
      endpoints: [
        { method: 'GET', path: '/api/data-operations/export', description: 'Veri dışa aktarma' },
        { method: 'POST', path: '/api/data-operations/import', description: 'Veri içe aktarma' },
        { method: 'GET', path: '/api/data-operations/backup/status', description: 'Yedekleme durumu' },
      ],
    },
    {
      category: 'Integrations',
      endpoints: [
        { method: 'GET', path: '/api/integrations', description: 'Entegrasyon listesi' },
        { method: 'POST', path: '/api/integrations', description: 'Entegrasyon oluştur' },
        { method: 'POST', path: '/api/integrations/sso/setup', description: 'SSO kurulumu' },
      ],
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500 text-white';
      case 'POST':
        return 'bg-green-500 text-white';
      case 'PATCH':
        return 'bg-yellow-500 text-white';
      case 'DELETE':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Dokümantasyonu</h1>
        <p className="text-muted-foreground mt-2">
          BarcodePOS Control Plane API referans dokümantasyonu
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm">/api</code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">JWT Token veya Cookie</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">JSON Request/Response</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {apiEndpoints.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle>{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.endpoints.map((endpoint, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className={`px-2 py-1 rounded text-xs font-mono ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="flex-1 text-sm font-mono">{endpoint.path}</code>
                    <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Örnek İstek
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`// GET /api/tenants
fetch('/api/tenants', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));

// POST /api/tenants
fetch('/api/tenants', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Example Tenant',
    isActive: true
  })
})
.then(res => res.json())
.then(data => console.log(data));`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocs;
