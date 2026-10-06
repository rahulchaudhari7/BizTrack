import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { Expense } from '../types.ts';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense | null;
  defaultIsPersonal?: boolean;
}

const BUSINESS_CATEGORIES = [
  'Inventory / Stock',
  'Rent',
  'Salary',
  'Transportation',
  'Utilities',
  'Marketing',
  'Advertising',
  'Office Supplies',
  'Equipment',
  'Maintenance',
  'Internet',
  'Phone',
  'Bank Charges',
  'Taxes',
  'Other',
];

const PERSONAL_CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Education',
  'Family',
  'Entertainment',
  'Medical',
  'Travel',
  'Other',
];

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Fonepay',
  'eSewa',
  'Khalti',
  'IME Pay',
  'ConnectIPS',
  'Debit Card',
  'Credit Card',
  'Cheque',
  'Other',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
  defaultIsPersonal = false,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Rent');
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isPersonal, setIsPersonal] = useState(defaultIsPersonal);
  const [vendor, setVendor] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setName(expenseToEdit.name);
      setAmount(expenseToEdit.amount.toString());
      setDate(new Date(expenseToEdit.date).toISOString().slice(0, 10));
      const cat = expenseToEdit.category;
      const list = expenseToEdit.isPersonal ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;
      if (list.includes(cat)) {
        setCategory(cat);
        setCustomCategory('');
      } else {
        setCategory('custom');
        setCustomCategory(cat);
      }
      setPaymentMethod(expenseToEdit.paymentMethod || 'Cash');
      setIsPersonal(expenseToEdit.isPersonal);
      setVendor(expenseToEdit.vendor || '');
      setBillNumber(expenseToEdit.billNumber || '');
      setNotes(expenseToEdit.notes || '');
    } else {
      setName('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory(defaultIsPersonal ? 'Personal' : 'Rent');
      setCustomCategory('');
      setPaymentMethod('Cash');
      setIsPersonal(defaultIsPersonal);
      setVendor('');
      setBillNumber('');
      setNotes('');
    }
    setError(null);
  }, [expenseToEdit, isOpen, defaultIsPersonal]);

  const currency = user?.currencySymbol || 'रु';
  const categoryList = isPersonal ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!name.trim()) {
      setError('Please provide an expense name.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() || 'Other' : category;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        amount: parsedAmount,
        date,
        category: finalCategory,
        paymentMethod,
        isPersonal,
        vendor: vendor.trim(),
        billNumber: billNumber.trim(),
        notes: notes.trim(),
      };

      if (expenseToEdit) {
        await api.put(`/expenses/${expenseToEdit._id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Expense Record' : 'Record New Expense'}
      subtitle={
        isPersonal
          ? 'Personal expense kept separate from business profit'
          : 'Business operating expenditure'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Expense Type Switcher */}
        <div className="p-1 bg-slate-100 rounded-xl flex items-center">
          <button
            type="button"
            onClick={() => {
              setIsPersonal(false);
              setCategory('Rent');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isPersonal
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 Business Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPersonal(true);
              setCategory('Food');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isPersonal
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 Personal Expense
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Expense Name / Particulars *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Office Rent, Electricity, Delivery, Refreshments"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Amount ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="custom">+ Custom Category</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {category === 'custom' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Custom Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Legal Fees, Trade License"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vendor / Paid To (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. NEA, WorldLink, Landlord, Pathao"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bill / Voucher No. (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. BILL-9801"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Description (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add invoice notes or description..."
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
            {loading ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
