import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Expenses } from './pages/Expenses.tsx';
import { Products } from './pages/Products.tsx';
import { Sales } from './pages/Sales.tsx';
import { Purchases } from './pages/Purchases.tsx';
import { PersonalExpenses } from './pages/PersonalExpenses.tsx';
import { Transactions } from './pages/Transactions.tsx';
import { Reports } from './pages/Reports.tsx';
import { Settings } from './pages/Settings.tsx';
import { Auth } from './pages/Auth.tsx';
import { ExpenseModal } from './components/ExpenseModal.tsx';
import { SaleModal } from './components/SaleModal.tsx';
import { PurchaseModal } from './components/PurchaseModal.tsx';
import { ProductModal } from './components/ProductModal.tsx';
import api from './services/api.ts';

// Protected App Layout Shell
const AppLayout: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Quick Action Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const fetchLowStockCount = async () => {
    if (!token) return;
    try {
      const res = await api.get('/products?stockStatus=low');
      if (res.data?.products) {
        setLowStockCount(res.data.products.length);
      }
    } catch (err) {
      // Ignore background badge error
    }
  };

  useEffect(() => {
    if (token) {
      fetchLowStockCount();
    }
  }, [token]);

  const handleQuickAction = (action: 'expense' | 'sale' | 'purchase' | 'product') => {
    if (action === 'expense') setExpenseModalOpen(true);
    if (action === 'sale') setSaleModalOpen(true);
    if (action === 'purchase') setPurchaseModalOpen(true);
    if (action === 'product') setProductModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Initializing BizTrack...
          </span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        lowStockAlertCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Navbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onQuickAction={handleQuickAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard onQuickAction={handleQuickAction} />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/personal-expenses" element={<PersonalExpenses />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => {
          fetchLowStockCount();
        }}
      />

      <SaleModal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        onSuccess={() => {
          fetchLowStockCount();
        }}
      />

      <PurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSuccess={() => {
          fetchLowStockCount();
        }}
      />

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSuccess={() => {
          fetchLowStockCount();
        }}
      />
    </div>
  );
};

// Root Component
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRoute />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Auth Route guard
const AuthRoute: React.FC = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Auth />;
};
