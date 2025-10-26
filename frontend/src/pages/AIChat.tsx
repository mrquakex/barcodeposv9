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
    <div className="h-[calc(100vh-8rem)] flex flex-col relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-slate-500 to-cyan-500 blur-3xl"
        />
      </div>

      {/* Header - ULTRA MODERN */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6 relative z-10"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-xl border-0 shadow-2xl p-6 md:p-8">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-slate-700/5 dark:from-blue-600/10 dark:to-slate-700/10" />
          
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-slate-700 opacity-80" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-6">
              {/* AI Icon - Animated */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-slate-700 flex items-center justify-center shadow-2xl border-2 border-white/50 dark:border-white/20">
                  <Brain className="w-9 h-9 md:w-12 md:h-12 text-white" />
                </div>
              </motion.div>
              
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-slate-700 bg-clip-text text-transparent"
                >
                  AI Asistan
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
                  <p className="text-xs md:text-sm font-bold bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                    Powered by Groq AI • Llama 3.3 70B
                  </p>
                </motion.div>
              </div>
            </div>
            
            {/* Status Badges - Floating */}
            <div className="flex gap-3 flex-wrap justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 backdrop-blur-sm border-2 border-green-300/50 dark:border-green-700/50 rounded-2xl shadow-xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                  <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs md:text-sm font-black text-green-700 dark:text-green-400">Sistem Entegre</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 backdrop-blur-sm border-2 border-blue-300/50 dark:border-blue-700/50 rounded-2xl shadow-xl">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                  <span className="text-xs md:text-sm font-black text-blue-700 dark:text-blue-400">AI Online</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Container - ULTRA MODERN */}
      <div className="flex-1 relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-2xl z-10">
        {/* Top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-slate-700" />
        
        {/* Messages Container */}
        <div className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-4 md:space-y-6 bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-950/50">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`flex gap-3 md:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative flex-shrink-0"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-40" />
                    <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-slate-700 flex items-center justify-center shadow-2xl border-2 border-white/50 dark:border-white/20">
                      <Bot className="w-5 h-5 md:w-7 md:h-7 text-white" />
                    </div>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`relative max-w-[85%] md:max-w-[70%] p-4 md:p-5 rounded-3xl shadow-xl group ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-slate-700 text-white'
                      : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 text-slate-900 dark:text-white border-2 border-blue-200/50 dark:border-slate-700/50'
                  }`}
                >
                  {/* Glassmorphism overlay for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-600/10 dark:to-purple-600/10 rounded-3xl" />
                  )}
                  
                  {/* Message glow effect */}
                  <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    message.role === 'user'
                      ? 'shadow-2xl shadow-blue-500/30'
                      : 'shadow-2xl shadow-purple-500/20 dark:shadow-blue-500/20'
                  }`} />
                  
                  <div className="relative">
                    <p className="text-sm md:text-base font-semibold leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20 dark:border-slate-700/50">
                      <p className={`text-xs font-bold ${
                        message.role === 'user' 
                          ? 'text-white/80' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.role === 'assistant' && (
                        <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                </motion.div>

                {message.role === 'user' && (
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="relative flex-shrink-0"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-slate-700 rounded-2xl blur-lg opacity-40" />
                    <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-2xl border-2 border-white/50 dark:border-white/20">
                      <User className="w-5 h-5 md:w-7 md:h-7 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-3 md:gap-4"
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-40 animate-pulse" />
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-slate-700 flex items-center justify-center shadow-2xl border-2 border-white/50 dark:border-white/20">
                  <Bot className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-4 md:p-5 rounded-3xl shadow-xl border-2 border-blue-200/50 dark:border-slate-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-600/10 dark:to-purple-600/10 rounded-3xl" />
                <div className="relative flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">AI düşünüyor...</span>
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex gap-1"
                  >
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions - ULTRA MODERN */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-24 left-0 right-0 px-4 md:px-8 py-6 border-t-2 border-blue-200/30 dark:border-slate-700/30 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-xl z-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-black text-slate-700 dark:text-slate-300">Hızlı Başlangıç</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={loading}
                  className="relative group"
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${
                    action.color === 'blue' 
                      ? 'from-blue-500 to-purple-500' 
                      : 'from-slate-500 to-blue-500'
                  } rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                  
                  {/* Button */}
                  <div className="relative p-4 md:p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 border-blue-200/50 dark:border-slate-700/50 shadow-xl group-hover:shadow-2xl transition-all group-disabled:opacity-50 group-disabled:cursor-not-allowed">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-600/10 dark:to-purple-600/10 rounded-2xl" />
                    <div className="relative flex flex-col items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <action.icon className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
                      </motion.div>
                      <p className="text-xs md:text-sm font-black text-center text-slate-700 dark:text-slate-300">{action.label}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Area - FLOATING MODERN */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t-2 border-blue-200/30 dark:border-slate-700/30 bg-gradient-to-r from-slate-50/95 to-blue-50/95 dark:from-slate-950/95 dark:to-slate-900/95 backdrop-blur-xl z-20">
          <div className="flex gap-3 md:gap-4">
            {/* Input Field */}
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-30 transition-opacity duration-300" />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mesajınızı yazın... (Enter ile gönder)"
                className="relative w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-200/50 dark:border-slate-700/50 focus:border-blue-500 dark:focus:border-blue-600 focus:outline-none resize-none font-semibold text-slate-900 dark:text-white placeholder-slate-400 shadow-xl focus:shadow-2xl transition-all"
                rows={2}
                disabled={loading}
              />
            </div>
            
            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              
              {/* Button */}
              <div className="relative px-6 md:px-8 py-4 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-700 text-white font-black shadow-2xl flex items-center gap-3 border-2 border-white/20">
                {loading ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="hidden md:inline">Gönder</span>
                  </>
                )}
              </div>
            </motion.button>
          </div>
          
          {/* Tips */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-center mt-3 text-slate-500 dark:text-slate-400 font-semibold"
          >
            💡 Tüm verilerinizi anlayabiliyorum • Shift+Enter ile yeni satır
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
