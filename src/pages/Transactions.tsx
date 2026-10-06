import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Search,
  Download,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import api from '../services/api.ts';
import { TransactionItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DateRangeFilter, DateFilterState } from '../components/DateRangeFilter.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

const TRANSACTION_TYPES = [
  'All',
  'Sale',
  'Purchase',
  'Business Expense',
  'Personal Expense',
];

const PAYMENT_METHODS = ['All', 'Cash', 'Bank', 'UPI', 'Card', 'Other'];

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ range: 'all' });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = { sortBy, sortOrder };
      if (search.trim()) params.search = search.trim();
      if (selectedType !== 'All') params.type = selectedType;
      if (selectedPayment !== 'All') params.paymentMethod = selectedPayment;

      if (dateFilter.range !== 'all') params.dateRange = dateFilter.range;
      if (dateFilter.range === 'custom') {
        params.startDate = dateFilter.startDate;
        params.endDate = dateFilter.endDate;
      }

      const res = await api.get('/transactions', { params });
      if (res.data?.transactions) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, selectedType, selectedPayment, dateFilter, sortBy, sortOrder]);

  const handleDelete = async (tx: TransactionItem) => {
    if (!window.confirm(`Delete ${tx.type} "${tx.name}"? This action will adjust financial summaries and inventory stock accordingly.`)) {
      return;
    }

    try {
      await api.delete(`/transactions/${tx.id}`);
      fetchTransactions();
    } catch (err) {
      alert('Unable to delete transaction.');
    }
  };

  const handleExportCSV = () => {
    const rows = transactions.map((t) => ({
      'Date': formatDate(t.date),
      'Type': t.type,
      'Description / Name': t.name,
      'Category': t.category,
      'Amount': t.amount,
      'Credit/Debit': t.isCredit ? 'Credit (+)' : 'Debit (-)',
      'Payment Method': t.paymentMethod,
      'Status': t.status,
      'Notes': t.notes || '',
    }));
    exportToCSV(rows, 'unified_transactions_journal');
  };

  const currency = user?.currencySymbol || 'रु';
  const totalInflow = transactions.filter((t) => t.isCredit).reduce((acc, t) => acc + t.amount, 0);
  const totalOutflow = transactions.filter((t) => !t.isCredit).reduce((acc, t) => acc + t.amount, 0);
  const netFlow = totalInflow - totalOutflow;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            General Journal & Audit Trail
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Unified Transactions History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single consolidated audit trail of all Sales, Restock Purchases, Operating Expenses, and Owner Withdrawals
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Journal CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stream Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Inflows (Credits)
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            +{formatCurrency(totalInflow, currency)}
          </span>
          <span className="text-xs text-slate-500">Collected from sales</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Outflows (Debits)
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            -{formatCurrency(totalOutflow, currency)}
          </span>
          <span className="text-xs text-slate-500">Purchases + expenses</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Net Transaction Flow
          </span>
          <span
            className={`text-2xl font-black mt-1 block ${
              netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {netFlow >= 0 ? '+' : ''}
            {formatCurrency(netFlow, currency)}
          </span>
          <span className="text-xs text-slate-500">Net balance for filtered records</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search across transactions, categories, vendors, or payment methods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                Type: {type}
              </option>
            ))}
          </select>

          {/* Payment Method filter */}
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
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="name">Sort by Name</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Date</th>
                <th className="py-3.5">Type</th>
                <th className="py-3.5">Name / Details</th>
                <th className="py-3.5">Category</th>
                <th className="py-3.5">Payment Method</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5 text-right">Amount</th>
                <th className="py-3.5 text-center pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-4 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          tx.type === 'Sale'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'Purchase'
                            ? 'bg-amber-100 text-amber-800'
                            : tx.type === 'Personal Expense'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{tx.name}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{tx.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-700">{tx.category}</td>
                    <td className="py-3.5 text-slate-600">{tx.paymentMethod}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 text-right font-black text-sm ${
                        tx.isCredit ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {tx.isCredit ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3.5 text-center pr-4">
                      <button
                        onClick={() => handleDelete(tx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
