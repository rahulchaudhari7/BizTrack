import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { Product, Customer } from '../types.ts';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/formatters.ts';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
  initialCustomerId?: string;
}

const PAYMENT_METHODS = [
  'Cash',
  'Fonepay',
  'eSewa',
  'Khalti',
  'ConnectIPS',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Cheque',
  'Other',
];

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
  initialCustomerId,
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [customProductName, setCustomProductName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+977 ');
  const [customerPan, setCustomerPan] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [quantity, setQuantity] = useState('1');
  const [sellingPrice, setSellingPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [isVatApplicable, setIsVatApplicable] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partially Paid' | 'Due'>('Paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
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
      const [prodRes, custRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
      ]);
      if (prodRes.data?.products) {
        setProducts(prodRes.data.products);
        if (initialProductId) {
          const match = prodRes.data.products.find((p: Product) => p._id === initialProductId);
          if (match) {
            setSelectedProductId(match._id);
            setSellingPrice(match.sellingPrice.toString());
            setIsVatApplicable(Boolean(match.isVatApplicable));
          }
        }
      }
      if (custRes.data?.customers) {
        setCustomers(custRes.data.customers);
        if (initialCustomerId) {
          const match = custRes.data.customers.find((c: Customer) => c._id === initialCustomerId);
          if (match) {
            setSelectedCustomerId(match._id);
            setCustomerName(match.name);
            setCustomerPhone(match.phone);
            setCustomerPan(match.panNumber || '');
            setCustomerAddress(match.address || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load products/customers for sale modal:', err);
    }
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProductId(id);
    if (id === 'custom') {
      setSellingPrice('');
      setIsVatApplicable(false);
    } else {
      const found = products.find((p) => p._id === id);
      if (found) {
        setSellingPrice(found.sellingPrice.toString());
        setCustomProductName(found.name);
        setIsVatApplicable(Boolean(found.isVatApplicable));
      }
    }
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    if (id === 'walkin' || !id) {
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCustomerPan('');
      setCustomerAddress('');
    } else {
      const found = customers.find((c) => c._id === id);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
        setCustomerPan(found.panNumber || '');
        setCustomerAddress(found.address || '');
      }
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const numQty = Number(quantity) || 0;
  const numPrice = Number(sellingPrice) || 0;
  const numDisc = Number(discount) || 0;

  const grossAmount = numQty * numPrice;
  const subtotal = Math.max(0, grossAmount - numDisc);
  const vatRate = user?.vatEnabled && isVatApplicable ? (user?.vatRate || 13) : 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const grandTotal = subtotal + vatAmount;

  // Amount Paid & Remaining Due calculation
  let calculatedPaid = 0;
  if (paymentStatus === 'Paid') {
    calculatedPaid = grandTotal;
  } else if (paymentStatus === 'Due') {
    calculatedPaid = 0;
  } else {
    calculatedPaid = Number(amountPaid) || 0;
  }
  const remainingDue = Math.max(0, grandTotal - calculatedPaid);

  const currency = user?.currencySymbol || 'रु';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numQty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    if (selectedProduct && selectedProduct.currentStock < numQty) {
      setError(
        `Insufficient stock! Only ${selectedProduct.currentStock} ${selectedProduct.unit || 'unit(s)'} available for "${selectedProduct.name}".`
      );
      return;
    }

    if (!selectedProductId || (selectedProductId === 'custom' && !customProductName.trim())) {
      setError('Please select or specify a product name.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/sales', {
        productId: selectedProductId !== 'custom' ? selectedProductId : undefined,
        productName: selectedProductId !== 'custom' ? selectedProduct?.name : customProductName.trim(),
        customerId: selectedCustomerId && selectedCustomerId !== 'walkin' ? selectedCustomerId : undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        customerPan: customerPan.trim(),
        customerAddress: customerAddress.trim(),
        quantity: numQty,
        unit: selectedProduct?.unit || 'Piece',
        sellingPrice: numPrice,
        discount: numDisc,
        isVatApplicable: user?.vatEnabled && isVatApplicable,
        vatRate,
        paymentMethod,
        paymentStatus,
        amountPaid: calculatedPaid,
        saleDate,
        notes: notes.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to record sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sale & Tax Invoice (बिक्री तथा बिजक)"
      subtitle="Generates Nepal Invoice, updates customer dues, and automatically decrements stock"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Product Selection */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Product Item (बिक्री हुने सामान)
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
                <option value="">-- Choose Product from Inventory --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — Stock: {p.currentStock} {p.unit || 'units'} — {formatCurrency(p.sellingPrice, currency)}
                  </option>
                ))}
                <option value="custom">+ Unlisted / Custom Item</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Available Stock</label>
              <div className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-indigo-700">
                {selectedProduct ? `${selectedProduct.currentStock} ${selectedProduct.unit || 'units'}` : '-'}
              </div>
            </div>
          </div>

          {selectedProductId === 'custom' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Product Name *</label>
              <input
                type="text"
                required
                placeholder="Product or service description"
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
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Rate ({currency}) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Discount ({currency})</label>
              <input
                type="number"
                step="any"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {user?.vatEnabled && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="saleVat"
                checked={isVatApplicable}
                onChange={(e) => setIsVatApplicable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="saleVat" className="text-xs font-bold text-slate-700 cursor-pointer">
                Apply 13% VAT on this invoice (१३% भ्याट लागू हुने)
              </label>
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Customer Information (ग्राहक विवरण)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Saved Customer</label>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="walkin">Walk-in Customer (खुद्रा ग्राहक)</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.totalDue > 0 ? `[Due: ${formatCurrency(c.totalDue, currency)}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="Customer full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+977 98XXXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer PAN (Optional)</label>
              <input
                type="text"
                placeholder="PAN Number"
                value={customerPan}
                onChange={(e) => setCustomerPan(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Address</label>
              <input
                type="text"
                placeholder="e.g. Baneshwor, Kathmandu"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Payment & Credit (Due) Settings */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Payment & Credit Terms (भुक्तानी तथा बाँकी हिसाब)
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
                <option value="Paid">Fully Paid (नगद प्राप्त)</option>
                <option value="Partially Paid">Partially Paid (आंशिक भुक्तानी)</option>
                <option value="Due">Credit / Due (उधारो)</option>
              </select>
            </div>

            {paymentStatus === 'Partially Paid' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Received ({currency})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={grandTotal}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Nepal Invoice Calculation Breakdown */}
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Product Subtotal:</span>
            <span className="font-bold text-slate-800">{formatCurrency(subtotal, currency)}</span>
          </div>
          {numDisc > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Discount Allowed:</span>
              <span className="font-bold text-rose-600">-{formatCurrency(numDisc, currency)}</span>
            </div>
          )}
          {user?.vatEnabled && isVatApplicable && (
            <div className="flex justify-between text-slate-600">
              <span>VAT (13%):</span>
              <span className="font-bold text-indigo-700">+{formatCurrency(vatAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black pt-2 border-t border-indigo-200/60 text-slate-900">
            <span>Grand Total (कुल जम्मा):</span>
            <span className="text-base text-indigo-900">{formatCurrency(grandTotal, currency)}</span>
          </div>

          {remainingDue > 0 && (
            <div className="flex justify-between text-xs font-bold pt-1 text-rose-600">
              <span>Customer Remaining Due (उठ्न बाँकी):</span>
              <span>{formatCurrency(remainingDue, currency)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sale Date *
            </label>
            <input
              type="date"
              required
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Delivery instructions, PO number..."
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
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {loading ? 'Recording...' : 'Generate Invoice & Record Sale'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
