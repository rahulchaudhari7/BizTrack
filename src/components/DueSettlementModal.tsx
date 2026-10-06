import React, { useState } from 'react';
import { Modal } from './Modal.tsx';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/formatters.ts';

interface DueSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  target: {
    type: 'sale' | 'purchase';
    id: string;
    title: string;
    partyName: string;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
  } | null;
}

const PAYMENT_METHODS = [
  'Cash',
  'Fonepay',
  'eSewa',
  'Khalti',
  'ConnectIPS',
  'Bank Transfer',
  'IME Pay',
  'Debit Card',
  'Credit Card',
  'Cheque',
  'Other',
];

export const DueSettlementModal: React.FC<DueSettlementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  target,
}) => {
  const { user } = useAuth();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (target) {
      setPaymentAmount(target.amountDue.toString());
      setPaymentMethod('Cash');
      setNotes('');
      setError(null);
    }
  }, [target, isOpen]);

  if (!target) return null;

  const isSale = target.type === 'sale';
  const currency = user?.currencySymbol || 'रु';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (amount > target.amountDue) {
      setError(`Amount cannot exceed the remaining due of ${formatCurrency(target.amountDue, currency)}.`);
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSale
        ? `/due/settle-sale/${target.id}`
        : `/due/settle-purchase/${target.id}`;

      await api.post(endpoint, {
        amountPaid: amount,
        paymentMethod,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSale ? 'Receive Customer Payment' : 'Pay Supplier Outstanding Due'}
      subtitle={`${isSale ? 'Customer' : 'Supplier'}: ${target.partyName} • ${target.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Due status snapshot */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-500 block">Total Bill</span>
            <span className="font-bold text-slate-800">{formatCurrency(target.totalAmount, currency)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Already Paid</span>
            <span className="font-bold text-emerald-700">{formatCurrency(target.amountPaid, currency)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Remaining Due</span>
            <span className="font-black text-rose-600">{formatCurrency(target.amountDue, currency)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Settlement Amount to {isSale ? 'Receive' : 'Pay'} ({currency}) *
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            max={target.amountDue}
            required
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Payment Channel / Method *
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

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Reference
          </label>
          <input
            type="text"
            placeholder="e.g. Transaction ID, Cheque number, or receipt notes"
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
            {loading ? 'Recording...' : 'Record Payment Settlement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
