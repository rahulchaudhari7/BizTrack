import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpDown,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api.ts';
import { Expense } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ExpenseModal } from '../components/ExpenseModal.tsx';
import { DateRangeFilter, DateFilterState } from '../components/DateRangeFilter.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

const CATEGORIES = [
  'All',
  'Product/Stock',
  'Transport',
  'Salary',
  'Rent',
  'Marketing',
  'Electricity',
  'Food',
  'Personal',
  'Office',
  'Other',
];

const PAYMENT_METHODS = ['All', 'Cash', 'Bank', 'UPI', 'Card', 'Other'];

export const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'business' | 'personal'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ range: 'all' });
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: any = {
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedPayment !== 'All') params.paymentMethod = selectedPayment;

      if (typeFilter === 'business') params.isPersonal = 'false';
      if (typeFilter === 'personal') params.isPersonal = 'true';

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
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, selectedCategory, selectedPayment, typeFilter, dateFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete expense "${name}"?`)) return;

    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert('Unable to delete expense.');
    }
  };

  const handleExportCSV = () => {
    const rows = expenses.map((e) => ({
      'Expense Name': e.name,
      'Amount': e.amount,
      'Date': formatDate(e.date),
      'Type': e.isPersonal ? 'Personal' : 'Business',
      'Category': e.category,
      'Payment Method': e.paymentMethod,
      'Notes': e.notes || '',
    }));
    exportToCSV(rows, 'expenses_ledger');
  };

  const totalExpenseSum = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const currency = user?.currencySymbol || 'रु';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Financial Ledger
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Expense Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log and audit daily business operational expenditures and personal drawls
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
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search input and Quick Type Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search expenses by name or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Expenses
            </button>
            <button
              onClick={() => setTypeFilter('business')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'business'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Business Only
            </button>
            <button
              onClick={() => setTypeFilter('personal')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'personal'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Personal Only
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

          {/* Category Dropdown */}
          <div className="flex items-center text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div className="flex items-center text-xs">
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  Payment: {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Toggle */}
          <button
            onClick={() => {
              if (sortBy === 'date') {
                setSortBy('amount');
              } else {
                setSortBy('date');
              }
            }}
            className="flex items-center space-x-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort by {sortBy === 'date' ? 'Date' : 'Amount'}</span>
          </button>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            {sortOrder === 'desc' ? '↓ High to Low' : '↑ Low to High'}
          </button>

          {/* Total Sum indicator */}
          <div className="ml-auto text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            Filtered Total: <span className="text-rose-600 font-black">{formatCurrency(totalExpenseSum, currency)}</span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Date</th>
                <th className="py-3.5">Expense Name</th>
                <th className="py-3.5">Type</th>
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
                        <div className="text-[11px] text-slate-600 truncate max-w-xs">{expense.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          expense.isPersonal
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {expense.isPersonal ? '👤 Personal' : '🏢 Business'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-700 font-medium">{expense.category}</td>
                    <td className="py-3.5 text-slate-600">{expense.paymentMethod}</td>
                    <td className="py-3.5 text-right pr-4 font-black text-rose-600 text-sm">
                      {formatCurrency(expense.amount, currency)}
                    </td>
                    <td className="py-3.5 text-center pr-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setExpenseToEdit(expense);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id, expense.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found matching current filters.
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
        onSuccess={fetchExpenses}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};
