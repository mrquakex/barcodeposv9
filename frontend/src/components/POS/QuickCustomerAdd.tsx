import React, { useState, useEffect } from 'react';
import FluentDialog from '../fluent/FluentDialog';
import FluentInput from '../fluent/FluentInput';
import FluentButton from '../fluent/FluentButton';
import { UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

/* ============================================
   QUICK CUSTOMER ADD DIALOG
   Microsoft Fluent Design System
   Enterprise POS Feature
   ============================================ */

interface QuickCustomerAddProps {
  open: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: any) => void;
}

const QuickCustomerAdd: React.FC<QuickCustomerAddProps> = ({ open, onClose, onCustomerAdded }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setName('');
      setPhone('');
      setEmail('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Lütfen müşteri adı girin');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/customers', {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });

      toast.success(`${response.data.name} başarıyla eklendi!`);
      onCustomerAdded(response.data);
      onClose();
    } catch (error: any) {
      console.error('Quick customer add error:', error);
      toast.error(error.response?.data?.message || 'Müşteri eklenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="Hızlı Müşteri Ekle"
      size="small"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field (Required) */}
        <div>
          <label className="fluent-caption font-medium text-foreground block mb-1.5">
            Müşteri Adı <span className="text-destructive">*</span>
          </label>
          <FluentInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Ahmet Yılmaz"
            className="w-full"
            autoFocus
            required
          />
        </div>

        {/* Phone Field (Optional) */}
        <div>
          <label className="fluent-caption font-medium text-foreground block mb-1.5">
            Telefon
          </label>
          <FluentInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Örn: 0555 123 4567"
            className="w-full"
          />
        </div>

        {/* Email Field (Optional) */}
        <div>
          <label className="fluent-caption font-medium text-foreground block mb-1.5">
            E-posta
          </label>
          <FluentInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Örn: ornek@email.com"
            className="w-full"
          />
        </div>

        <div className="pt-2 border-t border-border">
          <p className="fluent-caption text-foreground-secondary mb-3">
            💡 İpucu: Daha sonra müşteri bilgilerini düzenleyebilirsiniz
          </p>
          <div className="flex gap-2">
            <FluentButton
              type="button"
              appearance="subtle"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </FluentButton>
            <FluentButton
              type="submit"
              appearance="primary"
              className="flex-1"
              disabled={isSubmitting || !name.trim()}
              icon={<UserPlus className="w-4 h-4" />}
            >
              {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
            </FluentButton>
          </div>
        </div>
      </form>
    </FluentDialog>
  );
};

export default QuickCustomerAdd;
