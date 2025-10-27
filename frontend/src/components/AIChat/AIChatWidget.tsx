import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('🤖 Sending message to AI:', inputValue);
      const response = await api.post('/groq/chat', {
        message: inputValue,
      });
      console.log('✅ AI Response received:', response.data);

      let aiResponse = response.data.message || response.data.response || 'Yanıt alınamadı';
      
      // 🧭 NAVIGATE PARSER: AI'ın gönderdiği yönlendirme komutlarını yakala
      const navigateMatch = aiResponse.match(/\[NAVIGATE:(\/[a-zA-Z0-9\-\/]+)\]/);
      if (navigateMatch) {
        const route = navigateMatch[1];
        console.log('🧭 AI Navigation Detected:', route);
        
        // Yönlendirme mesajını temizle
        aiResponse = aiResponse.replace(/\[NAVIGATE:.*?\]/, '');
        
        // Kısa bir gecikme ile yönlendir (kullanıcı mesajı okusun)
        setTimeout(() => {
          navigate(route);
          toast.success('Sayfa yükleniyor...', { duration: 2000 });
        }, 1500);
      }
      
      // 🤖 ACTION PARSER: AI'ın gönderdiği aksiyonları yakalayıp execute et
      const actionMatch = aiResponse.match(/\[ACTION:([A-Z_]+):?({.*?})?\]/);
      if (actionMatch) {
        const actionType = actionMatch[1];
        const actionData = actionMatch[2] ? JSON.parse(actionMatch[2]) : null;
        
        console.log('🎯 AI Action Detected:', actionType, actionData);
        
        // Aksiyonu backend'e gönder ve execute et
        try {
          let actionResult;
          
          switch (actionType) {
            case 'CATEGORY_MOVE':
              actionResult = await api.post('/ai-actions/category-move', {
                categoryName: actionData.categoryName,
                productKeyword: actionData.productKeyword,
              });
              
              // Başarı mesajını AI yanıtına ekle
              const { categoryName, movedCount } = actionResult.data;
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              aiResponse += `\n\n✅ **İşlem Tamamlandı!**\n• "${categoryName}" kategorisi oluşturuldu\n• ${movedCount} ürün taşındı`;
              
              toast.success(`${movedCount} ürün "${categoryName}" kategorisine taşındı!`, { duration: 5000 });
              break;
              
            case 'UPDATE_PRICES':
              toast('Fiyat güncelleme özelliği yakında...', { duration: 3000 });
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              break;
              
            case 'UPDATE_STOCKS':
              toast('Stok güncelleme özelliği yakında...', { duration: 3000 });
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              break;
              
            case 'DELETE_INACTIVE':
              toast('İnaktif ürün silme özelliği yakında...', { duration: 3000 });
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              break;
              
            case 'DELETE_INVALID_BARCODES':
              actionResult = await api.post('/ai-actions/delete-invalid-barcodes');
              
              const deletedCount = actionResult.data.deletedCount || 0;
              const deletedProducts = actionResult.data.deletedProducts || [];
              
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              
              if (deletedCount > 0) {
                aiResponse += `\n\n✅ **${deletedCount} ürün silindi!**\n`;
                aiResponse += '\n🗑️ **Silinen ürünler:**\n';
                
                deletedProducts.slice(0, 10).forEach((p: any, i: number) => {
                  aiResponse += `\n${i + 1}. ${p.name} (Barkod: ${p.barcode})`;
                });
                
                if (deletedProducts.length > 10) {
                  aiResponse += `\n... ve ${deletedProducts.length - 10} ürün daha`;
                }
                
                toast.success(`${deletedCount} geçersiz barkodlu ürün silindi!`, { duration: 5000 });
              } else {
                aiResponse += '\n\n✅ Geçersiz barkodlu ürün bulunamadı.';
                toast('Geçersiz barkodlu ürün bulunamadı', { duration: 3000 });
              }
              break;
              
            case 'NATURAL_QUERY':
              actionResult = await api.post('/ai-actions/natural-query', {
                query: actionData.query,
              });
              
              // Sonuçları AI yanıtına ekle
              const { results, resultCount, resultType } = actionResult.data;
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              
              if (resultCount > 0) {
                aiResponse += '\n\n✅ **Sorgu Sonuçları:**\n';
                
                if (resultType === 'products_with_barcodes') {
                  results.slice(0, 30).forEach((p: any, i: number) => {
                    aiResponse += `\n${i + 1}. **${p.name}**`;
                    aiResponse += `\n   🏷️ Barkod: ${p.barcode}`;
                    aiResponse += `\n   💰 Fiyat: ${p.sellPrice?.toFixed(2)} TL`;
                    aiResponse += `\n   📦 Stok: ${p.stock} ${p.unit || 'adet'}`;
                    if (p.category?.name) aiResponse += `\n   📂 Kategori: ${p.category.name}`;
                    aiResponse += '\n';
                  });
                } else if (resultType === 'products' || resultType === 'products_with_sales') {
                  results.slice(0, 10).forEach((p: any, i: number) => {
                    aiResponse += `\n${i + 1}. **${p.name}**`;
                    aiResponse += `\n   💰 Fiyat: ${p.sellPrice?.toFixed(2)} TL`;
                    aiResponse += `\n   📦 Stok: ${p.stock} ${p.unit || 'adet'}`;
                    if (p.category?.name) aiResponse += `\n   📂 Kategori: ${p.category.name}`;
                    if (p.totalSold) aiResponse += `\n   📊 Satılan: ${p.totalSold} adet`;
                    aiResponse += '\n';
                  });
                } else if (resultType === 'customers') {
                  results.slice(0, 10).forEach((c: any, i: number) => {
                    aiResponse += `\n${i + 1}. **${c.name}**`;
                    if (c.phone) aiResponse += `\n   📞 Tel: ${c.phone}`;
                    if (c.debt) aiResponse += `\n   💸 Borç: ${c.debt.toFixed(2)} TL`;
                    aiResponse += '\n';
                  });
                }
                
                toast.success(`${resultCount} sonuç bulundu!`, { duration: 3000 });
              } else {
                aiResponse += '\n\n⚠️ Hiç sonuç bulunamadı.';
              }
              break;
              
            case 'CREATE_PRODUCT':
              actionResult = await api.post('/ai-actions/create-product', actionData);
              
              const newProduct = actionResult.data.product;
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              aiResponse += `\n\n✅ **Ürün oluşturuldu!**\n• Ad: ${newProduct.name}\n• Fiyat: ${newProduct.sellPrice} TL`;
              if (newProduct.category?.name) aiResponse += `\n• Kategori: ${newProduct.category.name}`;
              
              toast.success(`${newProduct.name} başarıyla eklendi!`, { duration: 4000 });
              break;
              
            case 'DELETE_PRODUCT':
              actionResult = await api.post('/ai-actions/delete-product', actionData);
              
              const deletedProductName = actionResult.data.deletedProduct;
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              aiResponse += `\n\n✅ **Ürün silindi:** ${deletedProductName}`;
              
              toast.success(`${deletedProductName} silindi!`, { duration: 4000 });
              break;
              
            case 'DELETE_CATEGORY':
              actionResult = await api.post('/ai-actions/delete-category', actionData);
              
              const deletedCategoryName = actionResult.data.deletedCategory;
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              aiResponse += `\n\n✅ **Kategori silindi:** ${deletedCategoryName}`;
              
              toast.success(`${deletedCategoryName} kategorisi silindi!`, { duration: 4000 });
              break;
              
            case 'CREATE_CUSTOMER':
              actionResult = await api.post('/ai-actions/create-customer', actionData);
              
              const newCustomer = actionResult.data.customer;
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
              aiResponse += `\n\n✅ **Müşteri oluşturuldu!**\n• Ad: ${newCustomer.name}`;
              if (newCustomer.phone) aiResponse += `\n• Telefon: ${newCustomer.phone}`;
              
              toast.success(`${newCustomer.name} başarıyla eklendi!`, { duration: 4000 });
              break;
              
            default:
              console.warn('⚠️ Bilinmeyen aksiyon:', actionType);
              aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
          }
        } catch (error: any) {
          console.error('❌ Action execution failed:', error);
          aiResponse = aiResponse.replace(/\[ACTION:.*?\]/, '');
          aiResponse += `\n\n❌ İşlem başarısız: ${error.response?.data?.error || error.message}`;
          toast.error('AI aksiyonu çalıştırılamadı');
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('❌ AI Chat error:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 'AI asistanına ulaşılamadı';
      toast.error(errorMsg);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `Üzgünüm, bir hata oluştu: ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 💠 Minimized State - Microsoft Fluent Design
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 group"
        style={{ boxShadow: 'var(--depth-16)' }}
      >
        {/* Main Button - Fluent Style */}
        <div className="relative w-12 h-12 md:w-14 md:h-14 bg-primary rounded-md flex flex-col items-center justify-center hover:bg-primary-hover active:bg-primary-pressed transition-colors duration-200">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white mb-0.5" strokeWidth={2} />
          <span className="text-white text-[8px] md:text-[9px] font-medium tracking-normal">AI</span>
          
          {/* Active Indicator - Fluent Badge */}
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-success rounded-full border-2 border-white" />
        </div>

        {/* Tooltip - Fluent Style (Desktop only) */}
        <div className="hidden md:block absolute bottom-full right-0 mb-2 px-3 py-2 bg-card border border-border rounded fluent-depth-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs text-foreground font-normal">
          AI Asistan
        </div>
      </button>
    );
  }

  // 💠 Expanded State - Microsoft Fluent Chat Window
  // 📱 Mobile: Full screen | 💻 Desktop: Floating window
  return (
    <div className="fixed inset-x-0 bottom-0 md:inset-auto md:bottom-6 md:right-6 z-50 w-full md:w-96 h-[80vh] md:h-[600px] bg-card rounded-t-lg md:rounded-md fluent-depth-64 flex flex-col overflow-hidden animate-scale-in border-t md:border border-border">
      {/* Header - Microsoft Fluent Style */}
      <div className="bg-background-alt px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-foreground fluent-subtitle font-semibold">AI Asistan</h3>
            <div className="flex items-center gap-1.5 fluent-caption text-foreground-secondary mt-0.5">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span>Çevrimiçi</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                toast.success('Sohbet temizlendi');
              }}
              className="p-2 hover:bg-background-tertiary rounded transition-colors"
              title="Sohbeti Temizle"
            >
              <svg className="w-4 h-4 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-background-tertiary rounded transition-colors"
            title="Küçült"
          >
            <Minimize2 className="w-4 h-4 text-foreground-secondary" strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              setMessages([]);
              setIsOpen(false);
            }}
            className="p-2 hover:bg-background-tertiary rounded transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4 text-foreground-secondary" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages - Microsoft Fluent Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background fluent-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-primary rounded flex items-center justify-center mb-4 fluent-depth-8">
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h4 className="fluent-title-3 text-foreground mb-2">
              Merhaba 👋
            </h4>
            <p className="fluent-body text-foreground-secondary leading-relaxed">
              Size nasıl yardımcı olabilirim? Satış, ürünler veya raporlarla ilgili sorularınızı sorabilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[75%] rounded px-3 py-2 fluent-body
                    ${message.role === 'user'
                      ? 'bg-primary text-white fluent-depth-4'
                      : 'bg-card text-foreground border border-border fluent-depth-4'
                    }
                  `}
                >
                  <p className="whitespace-pre-wrap break-words leading-normal">{message.content}</p>
                  <p
                    className={`fluent-caption mt-1 ${
                      message.role === 'user' ? 'text-white/70' : 'text-foreground-tertiary'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card text-foreground border border-border rounded px-4 py-3 fluent-depth-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" strokeWidth={2.5} />
                    <span className="fluent-body text-foreground-secondary">Düşünüyor...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input - Microsoft Fluent Style */}
      <div className="p-4 bg-background-alt border-t border-border">
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-input border border-border rounded fluent-body text-foreground placeholder-foreground-tertiary focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-primary text-white rounded hover:bg-primary-hover active:bg-primary-pressed disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};



