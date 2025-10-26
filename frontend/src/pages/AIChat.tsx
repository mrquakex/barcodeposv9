import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  TrendingUp,
  Package,
  Lightbulb,
  Loader2,
  Zap,
  Brain,
  Activity
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Merhaba ${user?.name}, ben BarcodePOS AI Asistanınızım.\n\nSistem verilerinize tam erişimim var ve gerçek zamanlı analizler yapabiliyorum.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nUZMANLIK ALANLARIM:\n\n• Satış Analizi ve Trend Raporları\n  Son 30 günün detaylı performans verileri\n\n• Ürün ve Stok Yönetimi\n  En çok satanlar, kritik stok seviyeleri, sipariş önerileri\n\n• Finansal Analiz\n  Ciro, kar marjı, nakit akışı ve gelir projeksiyonları\n\n• Stratejik İş Geliştirme\n  Büyüme fırsatları, müşteri segmentasyonu, pazarlama önerileri\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSize nasıl yardımcı olabilirim?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/gemini/chat', { message: input });
      let aiContent = response.data.message;

      // 🧭 Sayfa yönlendirme komutunu kontrol et
      const navigateMatch = aiContent.match(/\[NAVIGATE:(\/[a-z\-]+)\]/);
      
      if (navigateMatch) {
        const route = navigateMatch[1];
        // Komutu mesajdan çıkar
        aiContent = aiContent.replace(/\[NAVIGATE:\/[a-z\-]+\]/, '').trim();
        
        // AI mesajını göster
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        // 1 saniye bekle, ardından yönlendir
        toast.success(`🧭 Sayfa yükleniyor...`);
        setTimeout(() => {
          navigate(route);
        }, 1000);
      } else {
        // Normal mesaj (yönlendirme yok)
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'AI ile iletişim kurulamadı');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: TrendingUp, label: 'Satış Analizi', prompt: 'Son satışlarımı analiz eder misin?', color: 'blue' },
    { icon: Package, label: 'Stok Önerisi', prompt: 'Hangi ürünlerin stokunu artırmalıyım?', color: 'slate' },
    { icon: Lightbulb, label: 'İş Önerileri', prompt: 'İşimi geliştirmek için ne önerirsin?', color: 'blue' },
  ];

  const handleQuickAction = async (prompt: string) => {
    setInput(prompt);
    
    // Mesajı otomatik gönder
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/gemini/chat', { message: prompt });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'AI ile iletişim kurulamadı');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col relative overflow-hidden">
      {/* Subtle Background Gradient - Optimized */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600 to-slate-700 blur-3xl opacity-5" />
      </div>

      {/* Header - Corporate */}
      <div className="mb-4 md:mb-6 relative z-10">
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-slate-800 shadow-xl p-4 md:p-6">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-slate-700/5 dark:from-blue-600/10 dark:to-slate-700/10" />
          
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-slate-700 opacity-80" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              {/* AI Icon - Corporate */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-slate-700 rounded-2xl blur-lg opacity-30" />
                <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-xl border-2 border-white/50 dark:border-white/20">
                  <Brain className="w-6 h-6 md:w-9 md:h-9 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
                  AI Asistan
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Zap className="w-3 h-3 text-blue-600" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Powered by Groq AI • Llama 3.3 70B
                  </p>
                </div>
              </div>
            </div>
            
            {/* Status Badges - Corporate */}
            <div className="flex gap-2 md:gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Activity className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">Sistem Entegre</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/50 dark:to-slate-950/50 border-2 border-blue-300 dark:border-blue-700 rounded-xl shadow-lg">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">AI Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container - Corporate */}
      <div className="flex-1 relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-slate-800 shadow-xl z-10">
        {/* Top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-slate-700" />
        
        {/* Messages Container - Extra padding at bottom for input area */}
        <div className="h-full overflow-y-auto px-4 md:px-8 py-4 md:py-6 pb-48 md:pb-52 space-y-3 md:space-y-4">
          {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-lg border-2 border-white/50 dark:border-white/20">
                      <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>
                )}

                <div className={`relative max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-slate-700 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-blue-200 dark:border-slate-700'
                  }`}
                >
                  {/* Glassmorphism overlay for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 to-slate-700/3 dark:from-blue-600/5 dark:to-slate-700/5 rounded-2xl" />
                  )}
                  
                  <div className="relative">
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap" style={{ lineHeight: '1.6' }}>
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 dark:border-slate-700/50">
                      <p className={`text-xs font-medium ${
                        message.role === 'user' 
                          ? 'text-white/70' 
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.role === 'assistant' && (
                        <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400 opacity-50" />
                      )}
                    </div>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-lg border-2 border-white/50 dark:border-white/20">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-lg border-2 border-white/50 dark:border-white/20">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI yanıt hazırlıyor</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions - Corporate */}
        {messages.length === 1 && (
          <div className="absolute bottom-20 md:bottom-24 left-0 right-0 px-4 md:px-8 py-4 border-t-2 border-blue-200/30 dark:border-slate-700/30 bg-gradient-to-r from-blue-50/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3 h-3 text-blue-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Hızlı Başlangıç</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={loading}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-2 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <action.icon className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold text-center text-slate-700 dark:text-slate-300">{action.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area - Corporate */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 border-t-2 border-blue-200/30 dark:border-slate-700/30 bg-gradient-to-r from-slate-50/95 to-blue-50/95 dark:from-slate-950/95 dark:to-slate-900/95 backdrop-blur-sm z-20">
          <div className="flex gap-2 md:gap-3">
            {/* Input Field */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Sorunuzu yazın..."
              className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-600 focus:outline-none resize-none font-medium text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-lg focus:shadow-xl transition-all"
              rows={2}
              disabled={loading}
            />
            
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 md:px-6 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 text-white font-bold shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden md:inline text-sm">Gönder</span>
                </>
              )}
            </button>
          </div>
          
          {/* Tips */}
          <p className="text-xs text-center mt-2 text-slate-400 dark:text-slate-500 font-medium">
            Tüm sistem verilerinizi anlayabiliyorum • Enter ile gönder
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
