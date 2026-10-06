import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  ShieldCheck,
  ArrowUpDown,
  UserCheck,
} from 'lucide-react';
import api from '../services/api.ts';
import { Expense } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ExpenseModal } from '../components/ExpenseModal.tsx';
import { DateRangeFilter, DateFilterState } from '../components/DateRangeFilter.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

const CATEGORIES = ['All', 'Personal', 'Food', 'Transport', 'Electricity', 'Other'];
const PAYMENT_METHODS = ['All', 'Cash', 'Bank', 'UPI', 'Card', 'Other'];

export const PersonalExpenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ range: 'all' });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchPersonalExpenses = async () => {
    setLoading(true);
    try {
      const params: any = {
        isPersonal: 'true',
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedPayment !== 'All') params.paymentMethod = selectedPayment;

      if (dateFilter.range !== 'all') params.dateRange = dateFilter.range;
      if (dateFilter.range === 'custom') {
        params.startDate = dateFilter.startDate;
        params.endDate = dateFilter.endDate;
      }

      const res = await api.get('/expenses', { params });
      if (res.data?.expenses) {
        setExpenses(res.data.expenses);
      }
    } catch (err) {
      console.error('Failed to load personal expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalExpenses();
  }, [search, selectedCategory, selectedPayment, dateFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete personal expense "${name}"?`)) return;

    try {
      await api.delete(`/expenses/${id}`);
      fetchPersonalExpenses();
    } catch (err) {
      alert('Unable to delete expense.');
    }
  };

  const handleExportCSV = () => {
    const rows = expenses.map((e) => ({
      'Personal Expense': e.name,
      'Amount': e.amount,
      'Category': e.category,
      'Date': formatDate(e.date),
      'Payment Method': e.paymentMethod,
      'Notes': e.notes || '',
    }));
    exportToCSV(rows, 'personal_expenses_ledger');
  };

  const currency = user?.currencySymbol || 'रु';
  const totalPersonalSpend = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Owner Withdrawals & Personal Budget
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Personal Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly isolated from commercial business costs so true company profit remains 100% accurate
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
              setExpenseToEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl shadow-xs shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Personal Expense</span>
          </button>
        </div>
      </div>

      {/* Distinction Info Card */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-start space-x-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-purple-700 mt-0.5 shrink-0" />
        <div className="text-xs text-purple-900 leading-relaxed">
          <span className="font-bold">Accounting Isolation Principle:</span> Personal expenses tracked here
          are displayed for your personal financial awareness, but they are{' '}
          <span className="font-bold underline">never deducted</span> when computing your business Net Profit
          or Commercial Profit Margin.
        </div>
      </div>

      {/* KPI Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Personal Spending
          </span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">
            {formatCurrency(totalPersonalSpend, currency)}
          </span>
          <span className="text-xs text-slate-500">{expenses.length} personal expense items</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Average Personal Expense
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">
            {formatCurrency(expenses.length > 0 ? totalPersonalSpend / expenses.length : 0, currency)}
          </span>
          <span className="text-xs text-slate-500">Per logged withdrawal</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Ledger Status
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            Isolated
          </span>
          <span className="text-xs text-slate-500">Excluded from business COGS</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search personal expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

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

          <button
            onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
            className="flex items-center space-x-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort by {sortBy === 'date' ? 'Date' : 'Amount'}</span>
          </button>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {/* Personal Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Date</th>
                <th className="py-3.5">Expense Details</th>
                <th className="py-3.5">Category</th>
                <th className="py-3.5">Payment Method</th>
                <th className="py-3.5 text-right pr-4">Amount</th>
                <th className="py-3.5 text-center pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-4 text-slate-500 whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{expense.name}</div>
                      {expense.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{expense.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-700">{expense.category}</td>
                    <td className="py-3.5 text-slate-600">{expense.paymentMethod}</td>
                    <td className="py-3.5 text-right pr-4 font-black text-purple-900 text-sm">
                      {formatCurrency(expense.amount, currency)}
                    </td>
                    <td className="py-3.5 text-center pr-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setExpenseToEdit(expense);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Personal Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id, expense.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Personal Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No personal expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSuccess={fetchPersonalExpenses}
        expenseToEdit={expenseToEdit}
        defaultIsPersonal={true}
      />
    </div>
  );
};
