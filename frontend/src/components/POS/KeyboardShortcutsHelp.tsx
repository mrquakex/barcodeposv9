import React from 'react';
import FluentDialog from '../fluent/FluentDialog';
import { POSShortcuts } from '../../hooks/useKeyboardShortcuts';

/* ============================================
   KEYBOARD SHORTCUTS HELP MODAL
   Microsoft Fluent Design System
   ============================================ */

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ open, onClose }) => {
  const shortcuts = [
    { category: 'Genel İşlemler', items: [
      { key: POSShortcuts.HELP, desc: 'Bu pencereyi aç/kapat' },
      { key: POSShortcuts.DISCOUNT, desc: 'İndirim ekle' },
      { key: POSShortcuts.RETURN, desc: 'İade işlemi başlat' },
      { key: POSShortcuts.HOLD, desc: 'Satışı park et' },
      { key: POSShortcuts.CUSTOMER, desc: 'Müşteri seç' },
      { key: POSShortcuts.PRICE_OVERRIDE, desc: 'Fiyat değiştir' },
      { key: POSShortcuts.ADD_NOTE, desc: 'Not ekle' },
      { key: POSShortcuts.PRINT_BARCODE, desc: 'Barkod yazdır' },
      { key: POSShortcuts.SHIFT_REPORT, desc: 'Vardiya raporu' },
      { key: POSShortcuts.SETTINGS, desc: 'Ayarlar' },
    ]},
    { category: 'Sepet İşlemleri', items: [
      { key: `Ctrl+${POSShortcuts.PAYMENT}`, desc: 'Ödeme al' },
      { key: `Ctrl+${POSShortcuts.QUICK_CASH}`, desc: 'Nakit satış (hızlı)' },
      { key: `Ctrl+${POSShortcuts.DISCOUNT_CTRL}`, desc: 'İndirim ekle' },
      { key: `Ctrl+${POSShortcuts.HOLD_CTRL}`, desc: 'Satışı park et (Hold)' },
      { key: `Ctrl+${POSShortcuts.RETURN_CTRL}`, desc: 'İade işlemi' },
      { key: `Ctrl+${POSShortcuts.CLEAR_CART}`, desc: 'Sepeti temizle' },
      { key: POSShortcuts.DELETE, desc: 'Seçili ürünü sil' },
      { key: POSShortcuts.ESCAPE, desc: 'İptal / Modal kapat' },
    ]},
    { category: 'Arama ve Gezinme', items: [
      { key: `Ctrl+${POSShortcuts.SEARCH}`, desc: 'Arama kutusuna odaklan' },
      { key: 'Enter', desc: 'Ürün ekle / Onayla' },
      { key: '↑ / ↓', desc: 'Dropdown\'da gezin' },
      { key: 'Tab', desc: 'Sonraki alana geç' },
    ]},
  ];

  return (
    <FluentDialog
      open={open}
      onClose={onClose}
      title="⌨️ Klavye Kısayolları"
      size="large"
    >
      <div className="space-y-6 max-h-[600px] overflow-y-auto fluent-scrollbar">
        {shortcuts.map((section, idx) => (
          <div key={idx}>
            <h3 className="fluent-body font-semibold text-foreground mb-3 pb-2 border-b border-border">
              {section.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {section.items.map((shortcut, sIdx) => (
                <div
                  key={sIdx}
                  className="flex items-center justify-between p-2 rounded hover:bg-background-alt transition-colors"
                >
                  <span className="fluent-body-small text-foreground">{shortcut.desc}</span>
                  <kbd className="px-3 py-1.5 bg-background-alt border-2 border-border rounded font-mono text-xs font-semibold text-primary shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="fluent-caption text-foreground-secondary text-center">
          💡 İpucu: Input alanlarında yazarken kısayollar devre dışıdır (ESC hariç)
        </p>
      </div>
    </FluentDialog>
  );
};

export default KeyboardShortcutsHelp;
