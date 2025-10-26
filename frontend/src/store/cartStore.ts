import { create } from 'zustand';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTax: () => number;
  getNetTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product: Product, quantity = 1) => {
    const items = get().items;
    const existingItem = items.find((item) => item.product.id === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * product.price,
              }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            product,
            quantity,
            subtotal: product.price * quantity,
          },
        ],
      });
    }
  },

  removeItem: (productId: string) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.product.price,
            }
          : item
      ),
    });
  },

  setDiscount: (discount: number) => {
    set({ discount: Math.max(0, discount) });
  },

  clearCart: () => {
    set({ items: [], discount: 0 });
  },

  getTotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0);
  },

  getTax: () => {
    return get().items.reduce((tax, item) => {
      const itemTax = (item.subtotal * item.product.taxRate) / 100;
      return tax + itemTax;
    }, 0);
  },

  getNetTotal: () => {
    const total = get().getTotal();
    const discount = get().discount;
    return Math.max(0, total - discount);
  },
}));


