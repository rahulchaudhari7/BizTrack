import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { Product, Supplier } from '../types.ts';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/formatters.ts';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
  initialSupplierId?: string;
}

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'ConnectIPS',
  'Fonepay',
  'eSewa',
  'Khalti',
  'Cheque',
  'Debit Card',
  'Credit Card',
  'Other',
];

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
  initialSupplierId,
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [customProductName, setCustomProductName] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(initialSupplierId || '');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('+977 ');
  const [supplierPan, setSupplierPan] = useState('');
  const [billNumber, setBillNumber] = useState('');

  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState('Piece');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isVatApplicable, setIsVatApplicable] = useState(false);

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partially Paid' | 'Due'>('Paid');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [prodRes, supRes] = await Promise.all([
        api.get('/products'),
        api.get('/suppliers'),
      ]);
      if (prodRes.data?.products) {
        setProducts(prodRes.data.products);
        if (initialProductId) {
          const match = prodRes.data.products.find((p: Product) => p._id === initialProductId);
          if (match) {
            setSelectedProductId(match._id);
            setPurchasePrice(match.buyingPrice.toString());
            setUnit(match.unit || 'Piece');
            setSupplierName(match.supplier || '');
          }
        }
      }
      if (supRes.data?.suppliers) {
        setSuppliers(supRes.data.suppliers);
        if (initialSupplierId) {
          const match = supRes.data.suppliers.find((s: Supplier) => s._id === initialSupplierId);
          if (match) {
            setSelectedSupplierId(match._id);
            setSupplierName(match.name);
            setSupplierPhone(match.phone);
            setSupplierPan(match.panNumber || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load products/suppliers for purchase modal:', err);
    }
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProductId(id);
    if (id === 'custom') {
      setPurchasePrice('');
      setUnit('Piece');
    } else {
      const found = products.find((p) => p._id === id);
      if (found) {
        setPurchasePrice(found.buyingPrice.toString());
        setUnit(found.unit || 'Piece');
        setCustomProductName(found.name);
        if (found.supplier) setSupplierName(found.supplier);
      }
    }
  };

  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSupplierId(id);
    if (id === 'custom' || !id) {
      setSupplierName('');
      setSupplierPhone('');
      setSupplierPan('');
    } else {
      const found = suppliers.find((s) => s._id === id);
      if (found) {
        setSupplierName(found.name);
        setSupplierPhone(found.phone);
        setSupplierPan(found.panNumber || '');
      }
    }
  };

  const numQty = Number(quantity) || 0;
  const numPrice = Number(purchasePrice) || 0;
  const subtotal = numQty * numPrice;
  const vatRate = user?.vatEnabled && isVatApplicable ? (user?.vatRate || 13) : 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const totalPurchaseCost = subtotal + vatAmount;

  let calculatedPaid = 0;
  if (paymentStatus === 'Paid') {
    calculatedPaid = totalPurchaseCost;
  } else if (paymentStatus === 'Due') {
    calculatedPaid = 0;
  } else {
    calculatedPaid = Number(amountPaid) || 0;
  }
  const remainingDue = Math.max(0, totalPurchaseCost - calculatedPaid);

  const currency = user?.currencySymbol || 'रु';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numQty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (numPrice < 0) {
      setError('Purchase price cannot be negative.');
      return;
    }

    const selectedProduct = products.find((p) => p._id === selectedProductId);
    const finalName = selectedProductId !== 'custom' ? selectedProduct?.name : customProductName.trim();

    if (!finalName) {
      setError('Please select or specify a product name.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/purchases', {
        billNumber: billNumber.trim(),
        productId: selectedProductId !== 'custom' ? selectedProductId : undefined,
        productName: finalName,
        supplierId: selectedSupplierId && selectedSupplierId !== 'custom' ? selectedSupplierId : undefined,
        supplier: supplierName.trim() || 'General Supplier',
        supplierPhone: supplierPhone.trim(),
        supplierPan: supplierPan.trim(),
        quantity: numQty,
        unit,
        purchasePrice: numPrice,
        isVatApplicable: user?.vatEnabled && isVatApplicable,
        vatRate,
        purchaseDate,
        paymentStatus,
        paymentMethod,
        amountPaid: calculatedPaid,
        notes: notes.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to record purchase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Stock Purchase (सामान खरिद दाखिला)"
      subtitle="Adds new inventory units, updates vendor dues, and tracks stock investment"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Product selection */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Stock Product (खरिद गरिने सामान)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Product *</label>
              <select
                value={selectedProductId}
                onChange={handleProductSelect}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="">-- Choose Product to Restock --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (Current Stock: {p.currentStock} {p.unit || 'units'})
                  </option>
                ))}
                <option value="custom">+ Brand New / Unlisted Product</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Vendor Bill / Invoice #</label>
              <input
                type="text"
                placeholder="e.g. BILL-8012"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          {selectedProductId === 'custom' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">New Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Organic Ginger Candy, Type-C Hub"
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Cost Price Per Unit ({currency}) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {user?.vatEnabled && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="purchaseVat"
                checked={isVatApplicable}
                onChange={(e) => setIsVatApplicable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="purchaseVat" className="text-xs font-bold text-slate-700 cursor-pointer">
                Supplier charged 13% VAT (१३% खरिद भ्याट समावेश भएको)
              </label>
            </div>
          )}
        </div>

        {/* Supplier Info */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Supplier / Vendor (आपूर्तिकर्ता विवरण)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Saved Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={handleSupplierSelect}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="">-- Choose Supplier or Enter Below --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.totalDue > 0 ? `[Due to pay: ${formatCurrency(s.totalDue, currency)}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Supplier Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Himalayan Wholesale Traders"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Supplier Phone</label>
              <input
                type="text"
                placeholder="+977 98XXXXXXXX"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Supplier PAN / VAT</label>
              <input
                type="text"
                placeholder="PAN Number"
                value={supplierPan}
                onChange={(e) => setSupplierPan(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Payment & Supplier Due Terms */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Payment & Payables (भुक्तानी तथा साहुको बाँकी हिसाब)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Status *</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg cursor-pointer font-bold"
              >
                <option value="Paid">Fully Paid (नगद भुक्तान)</option>
                <option value="Partially Paid">Partially Paid (आंशिक भुक्तानी)</option>
                <option value="Due">Credit / Due (साहुलाई तिर्न बाँकी)</option>
              </select>
            </div>

            {paymentStatus === 'Partially Paid' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Paid ({currency})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={totalPurchaseCost}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Calculation Preview */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Stock Purchase Subtotal:</span>
            <span className="font-bold text-slate-800">{formatCurrency(subtotal, currency)}</span>
          </div>
          {user?.vatEnabled && isVatApplicable && (
            <div className="flex justify-between text-slate-600">
              <span>VAT Paid (13%):</span>
              <span className="font-bold text-amber-800">+{formatCurrency(vatAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black pt-2 border-t border-amber-200 text-amber-950">
            <span>Total Purchase Outlay (कुल खरिद खर्च):</span>
            <span className="text-base text-amber-950">{formatCurrency(totalPurchaseCost, currency)}</span>
          </div>
          {remainingDue > 0 && (
            <div className="flex justify-between text-xs font-bold pt-1 text-rose-600">
              <span>Supplier Due to Pay (साहुलाई तिर्न बाँकी):</span>
              <span>{formatCurrency(remainingDue, currency)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Purchase Date *
            </label>
            <input
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Consignment #, delivery truck notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
            />
          </div>
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
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-xs shadow-amber-600/20 transition-all cursor-pointer"
          >
            {loading ? 'Recording...' : 'Record Purchase & Update Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
