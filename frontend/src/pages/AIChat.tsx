import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Merhaba ${user?.name}! 👋 Ben BarcodePOS AI asistanınızım.\n\n✅ Sistem verilerinize tam erişimim var!\n\n✨ Yapabileceklerim:\n📊 Son 30 günün satış analizleri\n📈 Gerçek ciro ve trend raporları\n📦 En çok satan ürünler ve stok önerileri\n💡 İş geliştirme stratejileri\n🎯 Kişiselleştirilmiş tavsiyeler\n\nNe öğrenmek istersiniz?`,
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
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header - Corporate Blue/Slate */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-2xl border-4 border-blue-400 dark:border-blue-900">
              <Bot className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
                AI Asistan
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Powered by Groq AI (Llama 3.3)</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-3 border-green-300 dark:border-green-800 rounded-xl shadow-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-sm font-black text-green-700 dark:text-green-400">Sistem Entegre</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30 border-3 border-blue-300 dark:border-blue-800 rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
              <span className="text-sm font-black text-blue-700 dark:text-blue-400">AI Aktif</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Container - Enhanced */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl border-3 border-blue-400 dark:border-slate-800">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-xl border-3 border-blue-400 dark:border-blue-900">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] p-5 rounded-2xl shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-slate-700 text-white border-3 border-blue-300'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-3 border-blue-300 dark:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-3 opacity-70 font-bold">
                    {message.timestamp.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-xl border-3 border-blue-400 dark:border-blue-900">
                    <User className="w-7 h-7 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-xl border-3 border-blue-400 dark:border-blue-900">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border-3 border-blue-300 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">AI düşünüyor...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions - Enhanced */}
        {messages.length === 1 && (
          <div className="px-8 py-6 border-t-3 border-blue-400 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <p className="text-sm font-black mb-4 text-slate-700 dark:text-slate-300">⚡ Hızlı Sorular:</p>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={loading}
                  className="p-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-3 border-blue-400 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <action.icon className="w-7 h-7 mx-auto mb-3 text-blue-600 dark:text-blue-400 group-hover:scale-125 transition-transform" />
                  <p className="text-xs font-black text-center text-slate-700 dark:text-slate-300">{action.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input - Enhanced */}
        <div className="p-6 border-t-3 border-blue-400 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
          <div className="flex gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın... (Enter ile gönder)"
              className="flex-1 px-5 py-4 rounded-xl bg-white dark:bg-slate-800 border-3 border-blue-400 dark:border-slate-700 focus:border-blue-500 focus:outline-none resize-none font-semibold text-slate-900 dark:text-white placeholder-slate-400 shadow-lg"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-slate-700 text-white font-black hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 border-3 border-blue-300 hover:scale-105"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  <span>Gönder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIChat;
