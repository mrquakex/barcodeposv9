import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Star, StarOff, Barcode, Package } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentDialog from '../components/fluent/FluentDialog';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  taxRate: number;
  isFavorite: boolean;
  categoryId?: string;
  category?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    sellPrice: 0,
    buyPrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'Adet',
    taxRate: 18,
    categoryId: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/products', formData);
        toast.success('Product created');
      }
      fetchProducts();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const toggleFavorite = async (product: Product) => {
    try {
      await api.put(`/products/${product.id}`, { isFavorite: !product.isFavorite });
      toast.success(product.isFavorite ? 'Removed from favorites' : 'Added to favorites');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      sellPrice: product.sellPrice,
      buyPrice: product.buyPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      taxRate: product.taxRate,
      categoryId: product.categoryId || '',
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingProduct(null);
    setFormData({
      barcode: '',
      name: '',
      sellPrice: 0,
      buyPrice: 0,
      stock: 0,
      minStock: 5,
      unit: 'Adet',
      taxRate: 18,
      categoryId: '',
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Products</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
            {filteredProducts.length} products
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Add Product
        </FluentButton>
      </div>

      {/* Search */}
      <FluentCard elevation="depth4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name or barcode..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <FluentCard key={product.id} elevation="depth4" hover className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="fluent-body font-medium text-foreground truncate max-w-[150px]">
                    {product.name}
                  </h4>
                  <p className="fluent-caption text-foreground-secondary flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    {product.barcode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(product)}
                className="text-foreground-secondary hover:text-warning transition-colors"
              >
                {product.isFavorite ? (
                  <Star className="w-4 h-4 fill-warning text-warning" />
                ) : (
                  <StarOff className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Price</span>
                <span className="text-foreground font-medium">
                  ₺{product.sellPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Stock</span>
                <FluentBadge
                  appearance={product.stock <= product.minStock ? 'error' : 'success'}
                  size="small"
                >
                  {product.stock} {product.unit}
                </FluentBadge>
              </div>
              {product.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Category</span>
                  <span className="text-foreground-tertiary">{product.category.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1"
                icon={<Edit className="w-3 h-3" />}
                onClick={() => handleEdit(product)}
              >
                Edit
              </FluentButton>
              <FluentButton
                appearance="subtle"
                size="small"
                className="flex-1 text-destructive hover:bg-destructive/10"
                icon={<Trash2 className="w-3 h-3" />}
                onClick={() => handleDelete(product.id)}
              >
                Delete
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">
            {searchTerm ? 'No products found' : 'No products yet'}
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FluentInput
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              required
            />
            <FluentInput
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FluentInput
              label="Sell Price"
              type="number"
              step="0.01"
              value={formData.sellPrice}
              onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) })}
              required
            />
            <FluentInput
              label="Buy Price"
              type="number"
              step="0.01"
              value={formData.buyPrice}
              onChange={(e) => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) })}
              required
            />
            <FluentInput
              label="Stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              required
            />
            <FluentInput
              label="Min Stock"
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
              required
            />
            <FluentInput
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
            <FluentInput
              label="Tax Rate (%)"
              type="number"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
              required
            />
            <div className="md:col-span-2">
              <label className="fluent-body-small text-foreground-secondary block mb-2">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <FluentButton appearance="subtle" className="flex-1" onClick={handleCloseDialog}>
              Cancel
            </FluentButton>
            <FluentButton type="submit" appearance="primary" className="flex-1">
              {editingProduct ? 'Update' : 'Create'}
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default Products;

