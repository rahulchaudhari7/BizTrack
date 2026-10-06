export interface User {
  id: string;
  googleId?: string;
  name: string;
  email: string;
  profilePicture?: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  businessCategory: string;
  panNumber: string;
  vatEnabled: boolean;
  vatNumber: string;
  vatRate: number;
  phone: string;
  businessAddress?: string;
  country: string;
  province: string;
  district: string;
  municipality: string;
  wardNo: string;
  tole: string;
  fullAddress: string;
  currency: string;
  currencySymbol: string;
  lowStockThreshold: number;
  fiscalYearType: string;
  paymentMethods?: string[];
  customExpenseCategories?: string[];
  logoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  panNumber?: string;
  address?: string;
  province?: string;
  district?: string;
  municipality?: string;
  wardNo?: string;
  tole?: string;
  totalPurchases: number;
  transactionCount: number;
  totalDue: number;
  lastPurchaseDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  _id: string;
  userId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  panNumber?: string;
  address?: string;
  province?: string;
  district?: string;
  municipality?: string;
  totalPurchases: number;
  purchaseCount: number;
  totalDue: number;
  lastPurchaseDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: string;
  isPersonal: boolean;
  vendor?: string;
  billNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  userId: string;
  name: string;
  sku: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  quantityPurchased: number;
  quantitySold: number;
  currentStock: number;
  unit: string;
  minimumStock: number;
  supplier?: string;
  purchaseDate?: string;
  isVatApplicable?: boolean;
  notes?: string;
  totalInvestment?: number;
  currentStockValue?: number;
  sellingValue?: number;
  revenue?: number;
  profitPerUnit?: number;
  totalProfitRealized?: number;
  totalPotentialProfit?: number;
  profitMargin?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  createdAt: string;
}

export interface Sale {
  _id: string;
  userId: string;
  invoiceNumber: string;
  productId?: string;
  productName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerPan?: string;
  customerAddress?: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  buyingPrice?: number;
  discount: number;
  subtotal: number;
  isVatApplicable: boolean;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Due';
  amountPaid: number;
  amountDue: number;
  saleDate: string;
  notes?: string;
  createdAt: string;
}

export interface Purchase {
  _id: string;
  userId: string;
  billNumber?: string;
  productId?: string;
  productName: string;
  supplierId?: string;
  supplier: string;
  supplierPhone?: string;
  supplierPan?: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  subtotal: number;
  isVatApplicable: boolean;
  vatRate: number;
  vatAmount: number;
  totalPurchaseCost: number;
  purchaseDate: string;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Due';
  paymentMethod: string;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  originalId: string;
  type: 'Sale' | 'Purchase' | 'Business Expense' | 'Personal Expense';
  rawType: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: string;
  isCredit: boolean;
  notes?: string;
  details?: any;
}

export interface DashboardSummary {
  totalSales: number;
  totalIncome?: number;
  businessExpenses: number;
  personalExpenses: number;
  purchaseCosts: number;
  totalExpenses: number;
  totalBusinessCosts: number;
  netProfit: number;
  netLoss: number;
  isProfit: boolean;
  currentBalance: number;
  profitMargin: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  currentStockValue: number;
  totalSellingStockValue: number;
  vatCollected: number;
  vatEnabled: boolean;
  totalUnitsSold: number;
  totalSalesCount: number;
  totalPurchasesCount: number;
  totalProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface MonthlyDataPoint {
  monthKey: string;
  label: string;
  year: number;
  month: number;
  income: number;
  businessExpense: number;
  personalExpense: number;
  purchaseCost: number;
  totalExpense: number;
  netProfit: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  count: number;
}

export interface ProductPerformanceItem {
  id: string;
  name: string;
  category: string;
  unit?: string;
  buyingPrice: number;
  sellingPrice: number;
  currentStock: number;
  totalUnitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
}
