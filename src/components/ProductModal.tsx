import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { Product } from '../types.ts';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/formatters.ts';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
}

const UNITS = [
  'Piece',
  'Kg',
  'Gram',
  'Liter',
  'Meter',
  'Box',
  'Packet',
  'Dozen',
  'Set',
  'Other',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Piece');
  const [minimumStock, setMinimumStock] = useState('5');
  const [supplier, setSupplier] = useState('');
  const [isVatApplicable, setIsVatApplicable] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku || '');
      setCategory(productToEdit.category || 'General');
      setBuyingPrice(productToEdit.buyingPrice.toString());
      setSellingPrice(productToEdit.sellingPrice.toString());
      setQuantity(productToEdit.currentStock.toString());
      setUnit(productToEdit.unit || 'Piece');
      setMinimumStock((productToEdit.minimumStock !== undefined ? productToEdit.minimumStock : 5).toString());
      setSupplier(productToEdit.supplier || '');
      setIsVatApplicable(Boolean(productToEdit.isVatApplicable));
      setNotes(productToEdit.notes || '');
    } else {
      setName('');
      setSku('');
      setCategory('General');
      setBuyingPrice('');
      setSellingPrice('');
      setQuantity('10');
      setUnit('Piece');
      setMinimumStock((user?.lowStockThreshold || 5).toString());
      setSupplier('');
      setIsVatApplicable(false);
      setNotes('');
    }
    setError(null);
  }, [productToEdit, isOpen, user]);

  const currency = user?.currencySymbol || 'रु';
  const numBuying = Number(buyingPrice) || 0;
  const numSelling = Number(sellingPrice) || 0;
  const numQty = Number(quantity) || 0;

  const profitPerUnit = numSelling - numBuying;
  const totalInvestment = numBuying * numQty;
  const totalPotentialProfit = profitPerUnit * numQty;
  const profitMarginPercent = numSelling > 0 ? ((profitPerUnit / numSelling) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (numBuying < 0) {
      setError('Buying price cannot be negative.');
      return;
    }
    if (numSelling < 0) {
      setError('Selling price cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        buyingPrice: numBuying,
        sellingPrice: numSelling,
        unit,
        minimumStock: Number(minimumStock) || 0,
        supplier: supplier.trim(),
        isVatApplicable,
        notes: notes.trim(),
      };

      if (productToEdit) {
        await api.put(`/products/${productToEdit._id}`, {
          ...payload,
          currentStock: numQty,
        });
      } else {
        await api.post('/products', {
          ...payload,
          quantityPurchased: numQty,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product Item' : 'Add New Product'}
      subtitle="Track stock, purchase costs, unit packaging, and profit margins"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fine Pashmina Shawl, Ilam Black Tea"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              SKU / Barcode
            </label>
            <input
              type="text"
              placeholder="e.g. PAS-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs font-mono uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Buying Price ({currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.00"
              value={buyingPrice}
              onChange={(e) => setBuyingPrice(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Selling Price ({currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {productToEdit ? 'Current Stock' : 'Initial Stock'} *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Measurement Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Minimum Stock Alert
            </label>
            <input
              type="number"
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <input
              type="text"
              placeholder="e.g. Food, Clothing, Tech"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Live Automatic Math Preview */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-slate-500 block">Profit Per Unit</span>
            <span
              className={`font-bold text-sm ${profitPerUnit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
            >
              {formatCurrency(profitPerUnit, currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Margin</span>
            <span className="font-bold text-sm text-indigo-700">{profitMarginPercent}%</span>
          </div>
          <div>
            <span className="text-slate-500 block">Stock Investment</span>
            <span className="font-bold text-sm text-slate-800">
              {formatCurrency(totalInvestment, currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Potential Profit</span>
            <span className="font-bold text-sm text-emerald-700">
              {formatCurrency(totalPotentialProfit, currency)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Supplier / Vendor
            </label>
            <input
              type="text"
              placeholder="Supplier name or distributor"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          {user?.vatEnabled && (
            <div className="pt-5 flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVatApplicable"
                checked={isVatApplicable}
                onChange={(e) => setIsVatApplicable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="isVatApplicable" className="text-xs font-bold text-slate-700 cursor-pointer">
                Subject to 13% VAT
              </label>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Warranty, origin, batch number or specifications..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
        </div>

        <div className="pt-2 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {loading ? 'Saving...' : productToEdit ? 'Update Product' : 'Add to Inventory'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
