import { Router } from 'express';
import { authenticate } from '../middleware/auth.ts';
import {
  googleAuth,
  getMe,
  updateProfile,
  resetData,
} from '../controllers/authController.ts';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.ts';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.ts';
import {
  getSales,
  getSaleById,
  createSale,
  deleteSale,
} from '../controllers/saleController.ts';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  deletePurchase,
} from '../controllers/purchaseController.ts';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.ts';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.ts';
import {
  getDueSummary,
  settleSaleDue,
  settlePurchaseDue,
} from '../controllers/dueController.ts';
import {
  getDashboardSummary,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getProductPerformance,
  getPaymentMethodAnalytics,
} from '../controllers/dashboardController.ts';
import {
  getTransactions,
  deleteTransaction,
} from '../controllers/transactionController.ts';

const router = Router();

// --- Auth Routes (Google OAuth only) ---
router.post('/auth/google', googleAuth);
router.get('/auth/me', authenticate, getMe);
router.put('/auth/profile', authenticate, updateProfile);
router.post('/auth/seed-demo', authenticate, resetData);

// --- Expense Routes ---
router.get('/expenses', authenticate, getExpenses);
router.post('/expenses', authenticate, createExpense);
router.get('/expenses/:id', authenticate, getExpenseById);
router.put('/expenses/:id', authenticate, updateExpense);
router.delete('/expenses/:id', authenticate, deleteExpense);

// --- Product Routes ---
router.get('/products', authenticate, getProducts);
router.post('/products', authenticate, createProduct);
router.get('/products/:id', authenticate, getProductById);
router.put('/products/:id', authenticate, updateProduct);
router.delete('/products/:id', authenticate, deleteProduct);

// --- Sales Routes ---
router.get('/sales', authenticate, getSales);
router.post('/sales', authenticate, createSale);
router.get('/sales/:id', authenticate, getSaleById);
router.delete('/sales/:id', authenticate, deleteSale);

// --- Purchases Routes ---
router.get('/purchases', authenticate, getPurchases);
router.post('/purchases', authenticate, createPurchase);
router.get('/purchases/:id', authenticate, getPurchaseById);
router.delete('/purchases/:id', authenticate, deletePurchase);

// --- Customer Routes ---
router.get('/customers', authenticate, getCustomers);
router.post('/customers', authenticate, createCustomer);
router.get('/customers/:id', authenticate, getCustomerById);
router.put('/customers/:id', authenticate, updateCustomer);
router.delete('/customers/:id', authenticate, deleteCustomer);

// --- Supplier Routes ---
router.get('/suppliers', authenticate, getSuppliers);
router.post('/suppliers', authenticate, createSupplier);
router.get('/suppliers/:id', authenticate, getSupplierById);
router.put('/suppliers/:id', authenticate, updateSupplier);
router.delete('/suppliers/:id', authenticate, deleteSupplier);

// --- Due / Receivables & Payables Routes ---
router.get('/due/summary', authenticate, getDueSummary);
router.post('/due/settle-sale/:id', authenticate, settleSaleDue);
router.post('/due/settle-purchase/:id', authenticate, settlePurchaseDue);

// --- Dashboard Routes ---
router.get('/dashboard/summary', authenticate, getDashboardSummary);
router.get('/dashboard/monthly', authenticate, getMonthlyAnalytics);
router.get('/dashboard/categories', authenticate, getCategoryAnalytics);
router.get('/dashboard/products', authenticate, getProductPerformance);
router.get('/dashboard/payment-methods', authenticate, getPaymentMethodAnalytics);

// --- Transactions Routes ---
router.get('/transactions', authenticate, getTransactions);
router.delete('/transactions/:id', authenticate, deleteTransaction);

export default router;
