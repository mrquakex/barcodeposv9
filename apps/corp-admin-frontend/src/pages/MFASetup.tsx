import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, QrCode, CheckCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const MFASetup: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const { data: adminData } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/mfa/setup');
      return response.data;
    },
    onSuccess: (data) => {
      setMfaSecret(data.secret);
      setQrCode(data.qrCode);
      toast.success('MFA setup initiated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'MFA setup failed');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post('/mfa/verify', { token });
      return response.data;
    },
    onSuccess: () => {
      toast.success('MFA enabled successfully');
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'MFA verification failed');
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/mfa/disable');
      return response.data;
    },
    onSuccess: () => {
      toast.success('MFA disabled successfully');
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to disable MFA');
    },
  });

  const mfaEnabled = adminData?.admin?.mfaEnabled;

  if (mfaEnabled && !mfaSecret) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              MFA Aktif
            </CardTitle>
            <CardDescription>
              Multi-factor authentication aktif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              MFA'yı Devre Dışı Bırak
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            MFA (Multi-Factor Authentication) Kurulumu
          </CardTitle>
          <CardDescription>
            Hesabınızı ekstra güvenlik katmanıyla koruyun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!mfaSecret ? (
            <>
              <p className="text-sm text-muted-foreground">
                MFA kurulumu için bir authenticator uygulaması (Google Authenticator, Microsoft Authenticator, vb.) kullanmanız gerekiyor.
              </p>
              <Button
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                MFA Kurulumunu Başlat
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>1. Authenticator Uygulamanızda QR Kodu Tarayın</Label>
                  {qrCode ? (
                    <div className="mt-2">
                      <img src={qrCode} alt="QR Code" className="border rounded" />
                    </div>
                  ) : (
                    <div className="mt-2 p-8 border rounded flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>2. Veya Manuel Olarak Bu Kodu Girin</Label>
                  <p className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                    {mfaSecret}
                  </p>
                </div>
                <div>
                  <Label htmlFor="verificationCode">
                    3. Authenticator Uygulamanızdan Gelen 6 Haneli Kodu Girin
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="mt-2 font-mono text-center text-2xl tracking-widest"
                  />
                </div>
                <Button
                  onClick={() => verifyMutation.mutate(verificationCode)}
                  disabled={verificationCode.length !== 6 || verifyMutation.isPending}
                  className="w-full"
                >
                  {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Doğrula ve Aktif Et
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MFASetup;

