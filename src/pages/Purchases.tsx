import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Download,
  Trash2,
  Calendar,
  Building,
  CreditCard,
  ArrowUpDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import api from '../services/api.ts';
import { Purchase, Product } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { PurchaseModal } from '../components/PurchaseModal.tsx';
import { DateRangeFilter, DateFilterState } from '../components/DateRangeFilter.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

const PAYMENT_STATUSES = ['All', 'Paid', 'Pending', 'Partial'];

export const Purchases: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ range: 'all' });
  const [sortBy, setSortBy] = useState<'purchaseDate' | 'totalPurchaseCost' | 'quantity'>('purchaseDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchPurchasesAndProducts = async () => {
    setLoading(true);
    try {
      const params: any = { sortBy, sortOrder };
      if (search.trim()) params.search = search.trim();
      if (selectedProduct !== 'All') params.productId = selectedProduct;
      if (selectedStatus !== 'All') params.paymentStatus = selectedStatus;

      if (dateFilter.range !== 'all') params.dateRange = dateFilter.range;
      if (dateFilter.range === 'custom') {
        params.startDate = dateFilter.startDate;
        params.endDate = dateFilter.endDate;
      }

      const [purchasesRes, prodRes] = await Promise.all([
        api.get('/purchases', { params }),
        api.get('/products'),
      ]);

      if (purchasesRes.data?.purchases) setPurchases(purchasesRes.data.purchases);
      if (prodRes.data?.products) setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesAndProducts();
  }, [search, selectedProduct, selectedStatus, dateFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete purchase of "${name}"? This will decrement product inventory accordingly.`)) {
      return;
    }

    try {
      await api.delete(`/purchases/${id}`);
      fetchPurchasesAndProducts();
    } catch (err) {
      alert('Unable to delete purchase.');
    }
  };

  const handleExportCSV = () => {
    const rows = purchases.map((p) => ({
      'Product Name': p.productName,
      'Supplier': p.supplier,
      'Quantity': p.quantity,
      'Purchase Price': p.purchasePrice,
      'Total Purchase Cost': p.totalPurchaseCost,
      'Status': p.paymentStatus,
      'Payment Method': p.paymentMethod,
      'Date': formatDate(p.purchaseDate),
      'Notes': p.notes || '',
    }));
    exportToCSV(rows, 'stock_purchases_ledger');
  };

  const currency = user?.currencySymbol || 'रु';
  const totalPurchaseCost = purchases.reduce((acc, p) => acc + p.totalPurchaseCost, 0);
  const totalUnitsPurchased = purchases.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Procurement & Supply Chain
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Purchase Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log vendor supplier orders, stock replenishment costs, and manage inventory investments
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Purchase</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Purchase Cost
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">
            {formatCurrency(totalPurchaseCost, currency)}
          </span>
          <span className="text-xs text-slate-500">{purchases.length} restock batches</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Units Restocked
          </span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">
            {totalUnitsPurchased} units
          </span>
          <span className="text-xs text-slate-500">Delivered to warehouse</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Average Unit Cost
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {formatCurrency(
              totalUnitsPurchased > 0 ? totalPurchaseCost / totalUnitsPurchased : 0,
              currency
            )}
          </span>
          <span className="text-xs text-slate-500">Across current purchases</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by product name, supplier, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                Status: {status}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            <option value="purchaseDate">Sort by Date</option>
            <option value="totalPurchaseCost">Sort by Outlay Amount</option>
            <option value="quantity">Sort by Quantity</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Date</th>
                <th className="py-3.5">Stock Product</th>
                <th className="py-3.5">Supplier</th>
                <th className="py-3.5 text-center">Qty</th>
                <th className="py-3.5 text-right">Unit Price</th>
                <th className="py-3.5 text-right">Total Outlay</th>
                <th className="py-3.5 text-center">Status</th>
                <th className="py-3.5 text-center pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-4 text-slate-500 whitespace-nowrap">
                      {formatDate(purchase.purchaseDate)}
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{purchase.productName}</div>
                      {purchase.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{purchase.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-700">
                      <div className="flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{purchase.supplier}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 font-bold text-amber-900 border border-amber-200/60">
                        {purchase.quantity} units
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-slate-600">
                      {formatCurrency(purchase.purchasePrice, currency)}
                    </td>
                    <td className="py-3.5 text-right font-black text-amber-950 text-sm">
                      {formatCurrency(purchase.totalPurchaseCost, currency)}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          purchase.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : purchase.paymentStatus === 'Due'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-center pr-4">
                      <button
                        onClick={() => handleDelete(purchase._id, purchase.productName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Purchase & Decrement Stock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase orders recorded yet. Click "Record Purchase" to add supplier restocks!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PurchaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchPurchasesAndProducts}
      />
    </div>
  );
};
