import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { useNavigate } from 'react-router-dom';

export function VoiceCommandButton() {
  const navigate = useNavigate();

  // useMemo ile wrap ediyoruz - her render'da yeni array oluşturmasın
  const commands = useMemo(() => [
    {
      command: 'Ana Sayfaya Git',
      keywords: ['ana sayfa', 'dashboard', 'anasayfa'],
      callback: () => navigate('/dashboard'),
    },
    {
      command: 'Ürünleri Göster',
      keywords: ['ürünler', 'ürün', 'products'],
      callback: () => navigate('/products'),
    },
    {
      command: 'Satış Yap',
      keywords: ['satış', 'pos', 'kasa'],
      callback: () => navigate('/pos'),
    },
    {
      command: 'Müşteriler',
      keywords: ['müşteri', 'müşteriler', 'customers'],
      callback: () => navigate('/customers'),
    },
    {
      command: 'Raporlar',
      keywords: ['rapor', 'raporlar', 'reports'],
      callback: () => navigate('/reports'),
    },
    {
      command: 'Ayarlar',
      keywords: ['ayar', 'ayarlar', 'settings'],
      callback: () => navigate('/settings'),
    },
  ], [navigate]);

  const { isListening, toggleListening, isSupported } = useVoiceCommands(commands);

  if (!isSupported) {
    return null; // Tarayıcı desteklemiyorsa gösterme
  }

  return (
    <motion.button
      onClick={toggleListening}
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all ${
        isListening
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-blue-500 hover:bg-blue-600'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={isListening ? {
        boxShadow: [
          '0 0 0 0 rgba(239, 68, 68, 0.7)',
          '0 0 0 20px rgba(239, 68, 68, 0)',
        ],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: isListening ? Infinity : 0,
        repeatType: 'loop',
      }}
    >
      {isListening ? (
        <MicOff className="w-6 h-6 text-white" />
      ) : (
        <Mic className="w-6 h-6 text-white" />
      )}
    </motion.button>
  );
}

