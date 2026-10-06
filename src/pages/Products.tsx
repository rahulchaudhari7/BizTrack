import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Download,
  Edit2,
  Trash2,
  ShoppingCart,
  TrendingUp,
  Boxes,
  DollarSign,
  ArrowUpDown,
} from 'lucide-react';
import api from '../services/api.ts';
import { Product } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ProductModal } from '../components/ProductModal.tsx';
import { SaleModal } from '../components/SaleModal.tsx';
import { PurchaseModal } from '../components/PurchaseModal.tsx';
import { formatCurrency, exportToCSV } from '../utils/formatters.ts';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Quick sale or purchase directly from row
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState<'all' | 'low' | 'out' | 'in_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'currentStock' | 'sellingPrice' | 'totalProfitRealized'>('currentStock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { sortBy, sortOrder };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (stockStatus !== 'all') params.stockStatus = stockStatus;

      const res = await api.get('/products', { params });
      if (res.data?.products) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, stockStatus, sortBy, sortOrder]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove product "${name}" from inventory?`)) return;

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Unable to delete product.');
    }
  };

  const handleExportCSV = () => {
    const rows = products.map((p) => ({
      'Product Name': p.name,
      'SKU': p.sku,
      'Category': p.category,
      'Buying Price': p.buyingPrice,
      'Selling Price': p.sellingPrice,
      'Current Stock': p.currentStock,
      'Quantity Purchased': p.quantityPurchased,
      'Quantity Sold': p.quantitySold,
      'Total Investment': p.totalInvestment,
      'Revenue Realized': p.revenue,
      'Profit Realized': p.totalProfitRealized,
      'Supplier': p.supplier || '',
    }));
    exportToCSV(rows, 'inventory_products');
  };

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
  const lowStockThreshold = user?.lowStockThreshold || 5;
  const currency = user?.currencySymbol || 'रु';

  // Metrics
  const totalStockUnits = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
  const totalInventoryInvestment = products.reduce((acc, p) => acc + (p.totalInvestment || 0), 0);
  const totalRealizedRevenue = products.reduce((acc, p) => acc + (p.revenue || 0), 0);
  const totalRealizedProfit = products.reduce((acc, p) => acc + (p.totalProfitRealized || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Warehouse & Inventory
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Product Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock quantities, purchasing costs, profit margins, and inventory health
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
            onClick={() => {
              setProductToEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            In-Stock Units
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalStockUnits} units
          </span>
          <span className="text-[11px] text-slate-500">{products.length} products listed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Total Investment
          </span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">
            {formatCurrency(totalInventoryInvestment, currency)}
          </span>
          <span className="text-[11px] text-slate-500">Stock acquisition cost</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Sales Revenue
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {formatCurrency(totalRealizedRevenue, currency)}
          </span>
          <span className="text-[11px] text-slate-500">Gross sales collected</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Realized Profit
          </span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">
            +{formatCurrency(totalRealizedProfit, currency)}
          </span>
          <span className="text-[11px] text-slate-500">Units sold profit</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setStockStatus('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                stockStatus === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockStatus('low')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                stockStatus === 'low'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚠️ Low Stock (≤{lowStockThreshold})
            </button>
            <button
              onClick={() => setStockStatus('out')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                stockStatus === 'out'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            <option value="currentStock">Sort by Stock Level</option>
            <option value="name">Sort by Name</option>
            <option value="sellingPrice">Sort by Selling Price</option>
            <option value="totalProfitRealized">Sort by Realized Profit</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Product Details</th>
                <th className="py-3.5">Category</th>
                <th className="py-3.5 text-right">Cost Price</th>
                <th className="py-3.5 text-right">Selling Price</th>
                <th className="py-3.5 text-center">Unit Profit</th>
                <th className="py-3.5 text-center">Current Stock</th>
                <th className="py-3.5 text-center">Sold</th>
                <th className="py-3.5 text-right">Revenue</th>
                <th className="py-3.5 text-center pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {products.length > 0 ? (
                products.map((p) => {
                  const isLow = p.currentStock <= lowStockThreshold && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;
                  const unitProfit = p.sellingPrice - p.buyingPrice;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {p.sku ? `SKU: ${p.sku}` : 'No SKU'}
                          {p.supplier ? ` • ${p.supplier}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-600">{p.category || 'General'}</td>
                      <td className="py-3.5 text-right font-semibold text-slate-700">
                        {formatCurrency(p.buyingPrice, currency)}
                      </td>
                      <td className="py-3.5 text-right font-black text-indigo-900">
                        {formatCurrency(p.sellingPrice, currency)}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`font-bold ${unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                        >
                          +{formatCurrency(unitProfit, currency)}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : `${p.currentStock} units`}
                        </span>
                      </td>
                      <td className="py-3.5 text-center text-slate-700 font-bold">
                        {p.quantitySold || 0}
                      </td>
                      <td className="py-3.5 text-right font-bold text-emerald-700">
                        {formatCurrency(p.revenue, currency)}
                      </td>
                      <td className="py-3.5 text-center pr-4">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Quick Sell Button */}
                          <button
                            onClick={() => {
                              setSelectedProductId(p._id);
                              setSaleModalOpen(true);
                            }}
                            disabled={isOut}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                            title="Record Sale for this item"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          {/* Quick Restock Purchase Button */}
                          <button
                            onClick={() => {
                              setSelectedProductId(p._id);
                              setPurchaseModalOpen(true);
                            }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Restock Purchase"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products found in inventory. Click "Add Product" to create your first stock item!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={fetchProducts}
        productToEdit={productToEdit}
      />

      <SaleModal
        isOpen={saleModalOpen}
        onClose={() => {
          setSaleModalOpen(false);
          setSelectedProductId(undefined);
        }}
        onSuccess={fetchProducts}
        initialProductId={selectedProductId}
      />

      <PurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => {
          setPurchaseModalOpen(false);
          setSelectedProductId(undefined);
        }}
        onSuccess={fetchProducts}
        initialProductId={selectedProductId}
      />
    </div>
  );
};
