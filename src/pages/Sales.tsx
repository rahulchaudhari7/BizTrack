import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Download,
  Trash2,
  Calendar,
  CreditCard,
  User,
  ArrowUpDown,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api.ts';
import { Sale, Product } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SaleModal } from '../components/SaleModal.tsx';
import { DateRangeFilter, DateFilterState } from '../components/DateRangeFilter.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

const PAYMENT_METHODS = ['All', 'Cash', 'Bank', 'UPI', 'Card', 'Other'];

export const Sales: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ range: 'all' });
  const [sortBy, setSortBy] = useState<'saleDate' | 'totalAmount' | 'quantity'>('saleDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchSalesAndProducts = async () => {
    setLoading(true);
    try {
      const params: any = { sortBy, sortOrder };
      if (search.trim()) params.search = search.trim();
      if (selectedProduct !== 'All') params.productId = selectedProduct;
      if (selectedPayment !== 'All') params.paymentMethod = selectedPayment;

      if (dateFilter.range !== 'all') params.dateRange = dateFilter.range;
      if (dateFilter.range === 'custom') {
        params.startDate = dateFilter.startDate;
        params.endDate = dateFilter.endDate;
      }

      const [salesRes, prodRes] = await Promise.all([
        api.get('/sales', { params }),
        api.get('/products'),
      ]);

      if (salesRes.data?.sales) setSales(salesRes.data.sales);
      if (prodRes.data?.products) setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndProducts();
  }, [search, selectedProduct, selectedPayment, dateFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete sale of "${name}"? This will return the sold quantity back to inventory stock.`)) {
      return;
    }

    try {
      await api.delete(`/sales/${id}`);
      fetchSalesAndProducts();
    } catch (err) {
      alert('Unable to delete sale.');
    }
  };

  const handleExportCSV = () => {
    const rows = sales.map((s) => ({
      'Product Name': s.productName,
      'Quantity': s.quantity,
      'Unit Selling Price': s.sellingPrice,
      'Total Amount': s.totalAmount,
      'Customer Name': s.customerName || 'N/A',
      'Payment Method': s.paymentMethod,
      'Sale Date': formatDate(s.saleDate),
      'Notes': s.notes || '',
    }));
    exportToCSV(rows, 'sales_revenue_ledger');
  };

  const currency = user?.currencySymbol || 'रु';
  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalUnitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Revenue & Commercial Sales
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sales & Income Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log completed customer sales, auto-decrement stock, and record gross business income
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
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Sales Income
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {formatCurrency(totalSalesRevenue, currency)}
          </span>
          <span className="text-xs text-slate-500">{sales.length} transactions in filter</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Units Sold
          </span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">
            {totalUnitsSold} items
          </span>
          <span className="text-xs text-slate-500">Fulfilled customer orders</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Average Ticket Size
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {formatCurrency(sales.length > 0 ? totalSalesRevenue / sales.length : 0, currency)}
          </span>
          <span className="text-xs text-slate-500">Per customer transaction</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by product name, customer, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Product Filter Dropdown */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                Product: {p.name}
              </option>
            ))}
          </select>

          {/* Payment Method */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                Payment: {pm}
              </option>
            ))}
          </select>

          {/* Sort By Toggle */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            <option value="saleDate">Sort by Date</option>
            <option value="totalAmount">Sort by Sale Amount</option>
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

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Date</th>
                <th className="py-3.5">Product Sold</th>
                <th className="py-3.5 text-center">Qty</th>
                <th className="py-3.5 text-right">Unit Price</th>
                <th className="py-3.5 text-right">Total Sale</th>
                <th className="py-3.5">Customer</th>
                <th className="py-3.5">Payment</th>
                <th className="py-3.5 text-center pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-4 text-slate-500 whitespace-nowrap">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{sale.productName}</div>
                      {sale.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{sale.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                        {sale.quantity}x
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-slate-600">
                      {formatCurrency(sale.sellingPrice, currency)}
                    </td>
                    <td className="py-3.5 text-right font-black text-emerald-700 text-sm">
                      +{formatCurrency(sale.totalAmount, currency)}
                    </td>
                    <td className="py-3.5 text-slate-700">
                      {sale.customerName ? (
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{sale.customerName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in</span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-600">{sale.paymentMethod}</td>
                    <td className="py-3.5 text-center pr-4">
                      <button
                        onClick={() => handleDelete(sale._id, sale.productName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Sale & Restore Stock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales recorded yet. Click "Record New Sale" to log customer orders!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchSalesAndProducts}
      />
    </div>
  );
};
