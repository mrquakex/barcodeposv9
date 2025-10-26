import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Scan, TrendingUp, TrendingDown, Package, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PriceChanges from '@/components/Dashboard/PriceChanges';

export default function PriceMonitor() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'history'>('monitor');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
            Fiyat İzleme Sistemi
          </h1>
          <p className="text-muted-foreground mt-1">
            BenimPOS'tan otomatik fiyat kontrolü ve ürün takibi
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-6 py-3 font-semibold transition-all relative ${
            activeTab === 'monitor'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scan className="w-4 h-4 inline-block mr-2" />
          Fiyat Tarama
          {activeTab === 'monitor' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-slate-600"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold transition-all relative ${
            activeTab === 'history'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4 inline-block mr-2" />
          Tarama Geçmişi
          {activeTab === 'history' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-slate-600"
            />
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'monitor' && (
          <motion.div
            key="monitor"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <PriceChanges />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="border-2 border-blue-400 dark:border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Tarama Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tarama geçmişi yakında eklenecek...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

