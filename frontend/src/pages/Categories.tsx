import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Category } from '../types';
import api from '../lib/api';
import { 
  Plus, Edit, Trash2, FolderOpen, Package, 
  Coffee, Milk, Apple, Sandwich, Cookie, Pizza, 
  Wine, Beer, Droplet, IceCream, Beef, Fish,
  Shirt, Home, Laptop, Sparkles, Wrench, Heart,
  Baby, Book, Dumbbell, Gamepad2, Music, PawPrint,
  ArrowRight, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // Kategori isminden icon seçme fonksiyonu
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    
    // Gıda ve Yiyecekler
    if (name.includes('gıda') || name.includes('yiyecek') || name.includes('yemek')) return Apple;
    if (name.includes('ekmek') || name.includes('fırın') || name.includes('pasta')) return Cookie;
    if (name.includes('et') || name.includes('tavuk') || name.includes('kasap')) return Beef;
    if (name.includes('balık') || name.includes('deniz')) return Fish;
    if (name.includes('pizza')) return Pizza;
    if (name.includes('sandviç') || name.includes('sandwich')) return Sandwich;
    if (name.includes('dondurma')) return IceCream;
    
    // İçecekler
    if (name.includes('içecek') || name.includes('meşrubat') || name.includes('soda')) return Droplet;
    if (name.includes('kahve') || name.includes('çay')) return Coffee;
    if (name.includes('süt') || name.includes('mandıra')) return Milk;
    if (name.includes('alkol') || name.includes('şarap') || name.includes('wine')) return Wine;
    if (name.includes('bira') || name.includes('beer')) return Beer;
    
    // Giyim
    if (name.includes('giyim') || name.includes('kıyafet') || name.includes('tekstil')) return Shirt;
    
    // Ev & Yaşam
    if (name.includes('ev') || name.includes('mobilya') || name.includes('dekorasyon')) return Home;
    if (name.includes('temizlik') || name.includes('deterjan')) return Sparkles;
    
    // Elektronik
    if (name.includes('elektronik') || name.includes('teknoloji') || name.includes('bilgisayar')) return Laptop;
    
    // Diğer
    if (name.includes('bebek') || name.includes('çocuk')) return Baby;
    if (name.includes('kitap') || name.includes('kırtasiye')) return Book;
    if (name.includes('spor') || name.includes('fitness')) return Dumbbell;
    if (name.includes('oyuncak') || name.includes('oyun')) return Gamepad2;
    if (name.includes('müzik') || name.includes('enstrüman')) return Music;
    if (name.includes('hayvan') || name.includes('pet')) return PawPrint;
    if (name.includes('aksesuar') || name.includes('takı')) return Heart;
    if (name.includes('hırdavat') || name.includes('tamir')) return Wrench;
    
    // Varsayılan
    return FolderOpen;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { name: categoryName });
        toast.success('Kategori güncellendi!');
      } else {
        await api.post('/categories', { name: categoryName });
        toast.success('Kategori eklendi!');
      }
      fetchCategories();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setCategoryName(category.name);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/categories/${id}`);
      toast.success('Kategori silindi!');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Kategori silinemedi');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setCategoryName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Kategoriler</h1>
          <p className="text-muted-foreground mt-1 text-sm">Ürün kategorilerini yönetin • {categories.length} kategori</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="h-10 px-4 text-sm font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} />
          Yeni Kategori
        </Button>
      </motion.div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border border-blue-200 dark:border-blue-900 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" strokeWidth={2} />
                {editingId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="categoryName" className="font-semibold text-sm">Kategori Adı</Label>
                  <Input id="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Örn: Gıda, İçecek, Temizlik..." required autoFocus className="h-10" />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" className="h-10 px-6 font-bold text-sm bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600">{editingId ? 'Güncelle' : 'Ekle'}</Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="h-10 px-6 font-semibold text-sm">İptal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {categories.map((category: any, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
          >
            <Card 
              className="group relative overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:shadow-xl transition-all duration-300 bg-white dark:from-gray-900 cursor-pointer"
              onClick={() => navigate(`/products?category=${category.id}`)}
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-slate-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardContent className="relative p-5">
                {/* Icon Section - Centered */}
                <div className="flex flex-col items-center text-center space-y-3 mb-3">
                  {/* Minimalist Icon Box */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border border-blue-200 dark:border-blue-900 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    {React.createElement(getCategoryIcon(category.name), { 
                      className: 'w-8 h-8 text-blue-600 dark:text-blue-400',
                      strokeWidth: 2
                    })}
                  </div>
                  
                  {/* Category Name */}
                  <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {category.name}
                  </h3>
                </div>

                {/* Product Count - Compact */}
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30 rounded-lg border border-slate-300 dark:border-slate-700 group-hover:border-blue-400 transition-all">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    {category._count?.products || 0} ürün
                  </span>
                </div>

                {/* Action Buttons - Bottom Right Corner */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(category);
                    }} 
                    className="h-7 w-7 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
                    >
                    <Edit className="w-3.5 h-3.5" strokeWidth={2} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(category.id);
                    }} 
                    className="h-7 w-7 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </Button>
                </div>

                {/* Bottom Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-slate-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {categories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20">
            <CardContent className="text-center py-12">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-lg">
                  <FolderOpen className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Henüz Kategori Yok
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Ürünlerinizi düzenlemek için ilk kategoriyi oluşturun
              </p>
              <Button 
                className="h-11 px-6 text-sm font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg hover:shadow-xl transition-all hover:scale-105" 
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} />
                İlk Kategoriyi Ekle
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Categories;


