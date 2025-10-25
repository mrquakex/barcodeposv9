export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  taxRate: number;
  minStock: number;
  imageUrl?: string;
  categoryId?: string;
  category?: Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  debt: number;
  credit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  productId: string;
  product: Product;
  saleId: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER';
  isPaid: boolean;
  notes?: string;
  userId: string;
  user: User;
  customerId?: string;
  customer?: Customer;
  saleItems: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeTax?: string;
  logoUrl?: string;
  currency: string;
  theme: string;
  receiptFooter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todaySalesCount: number;
  monthRevenue: number;
  monthSalesCount: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  topProducts: {
    product: Product;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  last7DaysChart: {
    date: string;
    revenue: number;
    salesCount: number;
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  balance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  total: number;
  receivedQty: number;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId?: string;
  user?: User;
  branchId?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  category?: ExpenseCategory;
  amount: number;
  description: string;
  paymentMethod: string;
  expenseDate: string;
  receiptNumber?: string;
  userId: string;
  user?: User;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  discountType?: string;
  discountValue?: number;
  startDate: string;
  endDate: string;
  minPurchase?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  campaignId?: string;
  discountType: string;
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  minPurchase?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

