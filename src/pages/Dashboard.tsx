import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Briefcase,
  User,
  ShoppingBag,
  Scale,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CreditCard,
  Building2,
  Package,
  Layers,
  Receipt,
  PieChart as PieIcon,
  Wallet,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.ts';
import { DashboardSummary, MonthlyDataPoint, CategoryDataPoint, TransactionItem } from '../types.ts';
import { StatCard } from '../components/StatCard.tsx';
import { DateRangeFilter, DateFilterState } from '../components/DateRangeFilter.tsx';
import { formatCurrency, formatDate } from '../utils/formatters.ts';

const CATEGORY_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#64748b', '#14b8a6'];
const PAYMENT_COLORS = ['#10b981', '#4f46e5', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

interface PaymentMethodStat {
  method: string;
  total: number;
  count: number;
}

interface DashboardProps {
  onQuickAction: (action: 'expense' | 'sale' | 'purchase' | 'product') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onQuickAction }) => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ range: 'this_month' });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [categories, setCategories] = useState<CategoryDataPoint[]>([]);
  const [salesPaymentMethods, setSalesPaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [expensePaymentMethods, setExpensePaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter.range !== 'all') {
        params.dateRange = dateFilter.range;
      }
      if (dateFilter.range === 'custom') {
        params.startDate = dateFilter.startDate;
        params.endDate = dateFilter.endDate;
      }

      const [summaryRes, monthlyRes, catRes, paymentsRes] = await Promise.all([
        api.get('/dashboard/summary', { params }),
        api.get('/dashboard/monthly'),
        api.get('/dashboard/categories'),
        api.get('/dashboard/payment-methods').catch(() => ({ data: { salesPaymentMethods: [], expensePaymentMethods: [] } })),
      ]);

      if (summaryRes.data) {
        setSummary(summaryRes.data.summary);
        setRecentTransactions(summaryRes.data.recentTransactions || []);
      }
      if (monthlyRes.data) {
        setMonthlyData(monthlyRes.data.monthlyData || []);
      }
      if (catRes.data) {
        setCategories(catRes.data.categories || []);
      }
      if (paymentsRes.data) {
        setSalesPaymentMethods(paymentsRes.data.salesPaymentMethods || []);
        setExpensePaymentMethods(paymentsRes.data.expensePaymentMethods || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const currency = user?.currencySymbol || 'रु';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-emerald-500 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Business Overview • {user?.municipality || 'Kathmandu, Nepal'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                Verified Account
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Partner'} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.businessName || 'BizTrack Enterprise'} • Financial analytics, inventory tracking, and profit ledger
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {summary && summary.lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Low Stock Alert: {summary.lowStockCount} items below threshold
              </h4>
              <p className="text-[11px] text-amber-700">
                Replenish inventory to avoid stockouts and maintain fulfillment.
              </p>
            </div>
          </div>
          <button
            onClick={() => onQuickAction('purchase')}
            className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            Order Stock
          </button>
        </div>
      )}

      {/* Primary Financial Status Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Profit & Accrual Performance Card */}
        <div
          className={`md:col-span-2 p-6 rounded-2xl border shadow-xs transition-all flex flex-col justify-between ${
            summary?.isProfit
              ? 'bg-linear-to-br from-emerald-500/10 via-white to-emerald-50/40 border-emerald-200'
              : 'bg-linear-to-br from-rose-500/10 via-white to-rose-50/40 border-rose-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    summary?.isProfit
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white shadow-xs'
                  }`}
                >
                  {summary?.isProfit ? 'Operating in Net Profit' : 'Operating in Net Loss'}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Net Margin: {summary?.profitMargin || 0}% • Gross Margin: {summary?.grossMargin || 0}%
                </span>
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-black mt-2 tracking-tight ${
                  summary?.isProfit ? 'text-emerald-800' : 'text-rose-700'
                }`}
              >
                {summary?.isProfit ? '+' : '-'}
                {formatCurrency(
                  summary?.isProfit ? summary?.netProfit : summary?.netLoss,
                  currency
                )}
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-lg">
                Calculated as: Gross Profit ({formatCurrency(summary?.grossProfit || 0, currency)}) minus Operating Expenses ({formatCurrency(summary?.businessExpenses || 0, currency)})
              </p>
            </div>

            <div
              className={`p-3 rounded-2xl ${
                summary?.isProfit ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {summary?.isProfit ? (
                <ArrowUpRight className="w-8 h-8" />
              ) : (
                <ArrowDownRight className="w-8 h-8" />
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Total Sales</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(summary?.totalSales ?? summary?.totalIncome ?? 0, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Cost of Goods (COGS)</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(summary?.cogs || 0, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Gross Profit</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(summary?.grossProfit || 0, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Cash Balance</span>
              <span className="font-bold text-indigo-700 text-sm">
                {formatCurrency(summary?.currentBalance || 0, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Entry Actions */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Quick Actions
              </span>
              <Scale className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Record Transaction
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Log sales, record expenses, restock inventory, or add products
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onQuickAction('sale')}
                className="flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Sale</span>
              </button>
              <button
                onClick={() => onQuickAction('expense')}
                className="flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Expense</span>
              </button>
              <button
                onClick={() => onQuickAction('purchase')}
                className="flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>+ Stock Purchase</span>
              </button>
              <button
                onClick={() => onQuickAction('product')}
                className="flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>+ New Product</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 10 Core Financial & Operational KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Key Performance Indicators (10 Core Business Metrics)
          </h2>
          <span className="text-xs text-slate-400 font-medium">All figures in Nepalese Rupees ({currency})</span>
        </div>

        {/* Row 1: Revenue, Operating Cost, COGS, Gross Profit, Net Profit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-3.5">
          {/* 1. Total Sales */}
          <StatCard
            title="1. Total Sales"
            amount={formatCurrency(summary?.totalSales ?? summary?.totalIncome ?? 0, currency)}
            subtitle={`${summary?.totalSalesCount || 0} invoices issued`}
            icon={TrendingUp}
            colorScheme="emerald"
            badge={{ text: 'Gross Income', isPositive: true }}
          />

          {/* 2. Total Business Expenses */}
          <StatCard
            title="2. Business Expenses"
            amount={formatCurrency(summary?.businessExpenses || 0, currency)}
            subtitle="Rent, utilities, staff, ads"
            icon={Briefcase}
            colorScheme="indigo"
            badge={{ text: 'Operating', neutral: true }}
          />

          {/* 3. Cost of Goods Sold */}
          <StatCard
            title="3. Cost of Goods (COGS)"
            amount={formatCurrency(summary?.cogs || 0, currency)}
            subtitle={`${summary?.totalUnitsSold || 0} units inventory cost`}
            icon={ShoppingBag}
            colorScheme="amber"
            badge={{ text: 'Direct Cost', neutral: true }}
          />

          {/* 4. Gross Profit */}
          <StatCard
            title="4. Gross Profit"
            amount={formatCurrency(summary?.grossProfit || 0, currency)}
            subtitle={`Margin: ${summary?.grossMargin || 0}%`}
            icon={Layers}
            colorScheme="blue"
            badge={{ text: 'Sales - COGS', isPositive: (summary?.grossProfit || 0) >= 0 }}
          />

          {/* 5. Net Profit */}
          <StatCard
            title="5. Net Profit"
            amount={`${summary?.isProfit ? '+' : '-'}${formatCurrency(summary?.isProfit ? summary?.netProfit : summary?.netLoss, currency)}`}
            subtitle={`Net margin: ${summary?.profitMargin || 0}%`}
            icon={Scale}
            colorScheme={summary?.isProfit ? 'emerald' : 'rose'}
            badge={{ text: summary?.isProfit ? 'Profitable' : 'Loss', isPositive: summary?.isProfit }}
          />
        </div>

        {/* Row 2: Personal Expenses, Receivables, Payables, Cash Balance, Low Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 6. Personal Expenses */}
          <StatCard
            title="6. Personal Expenses"
            amount={formatCurrency(summary?.personalExpenses || 0, currency)}
            subtitle="Non-business household"
            icon={User}
            colorScheme="slate"
            badge={{ text: 'Isolated', neutral: true }}
          />

          {/* 7. Accounts Receivable */}
          <StatCard
            title="7. Accounts Receivable"
            amount={formatCurrency(summary?.outstandingReceivables || 0, currency)}
            subtitle="Customer dues to collect"
            icon={CreditCard}
            colorScheme="rose"
            badge={{ text: 'Due From Clients', neutral: true }}
          />

          {/* 8. Accounts Payable */}
          <StatCard
            title="8. Accounts Payable"
            amount={formatCurrency(summary?.outstandingPayables || 0, currency)}
            subtitle="Owed to wholesale vendors"
            icon={Building2}
            colorScheme="amber"
            badge={{ text: 'Due To Suppliers', neutral: true }}
          />

          {/* 9. Current Cash / Balance */}
          <StatCard
            title="9. Current Cash Balance"
            amount={formatCurrency(summary?.currentBalance || 0, currency)}
            subtitle="Liquid net cash flow"
            icon={Wallet}
            colorScheme="emerald"
            badge={{ text: 'Liquid Balance', isPositive: (summary?.currentBalance || 0) >= 0 }}
          />

          {/* 10. Low Stock Items */}
          <StatCard
            title="10. Low Stock Items"
            amount={`${summary?.lowStockCount || 0} items`}
            subtitle={`Stock value: ${formatCurrency(summary?.currentStockValue || 0, currency)}`}
            icon={Package}
            colorScheme={summary && summary.lowStockCount > 0 ? 'rose' : 'blue'}
            badge={{
              text: summary && summary.lowStockCount > 0 ? 'Needs Restock' : 'Stock Healthy',
              isPositive: summary?.lowStockCount === 0,
            }}
          />
        </div>
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue, Expenses & Profit Multi-Bar Trend */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue, Operating Expenses & Profit Trend</h3>
              <p className="text-xs text-slate-500">6-Month historical performance in Nepalese Rupees ({currency})</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
              Monthly Trajectory
            </span>
          </div>

          <div className="h-64 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="income" name="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="businessExpense" name="Business Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Profit" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly data recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Expense Category Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Expense Category Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution across business expense accounts</p>
          </div>

          <div className="h-52 w-full my-2 relative flex items-center justify-center">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value), currency), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No expense records found</div>
            )}
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {categories.slice(0, 5).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-600 font-medium truncate max-w-[120px]">{c.name}</span>
                </div>
                <span className="font-bold text-slate-800">{formatCurrency(c.value, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales by Payment Method */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales Collection by Payment Method</h3>
              <p className="text-xs text-slate-500">Inflows received via Cash, Fonepay, eSewa, Bank Transfer</p>
            </div>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>

          {salesPaymentMethods.length > 0 ? (
            <div className="space-y-2.5">
              {salesPaymentMethods.map((pm, idx) => {
                const totalSalesSum = salesPaymentMethods.reduce((acc, curr) => acc + curr.total, 0) || 1;
                const percentage = Math.round((pm.total / totalSalesSum) * 100);
                return (
                  <div key={pm.method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{pm.method} ({pm.count} orders)</span>
                      <span className="font-bold text-slate-900">{formatCurrency(pm.total, currency)} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No sales payments recorded yet
            </div>
          )}
        </div>

        {/* Expenses by Payment Method */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expenses by Payment Method</h3>
              <p className="text-xs text-slate-500">Outflows dispatched via Cash, Cheque, Digital Wallets</p>
            </div>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>

          {expensePaymentMethods.length > 0 ? (
            <div className="space-y-2.5">
              {expensePaymentMethods.map((pm, idx) => {
                const totalExpenseSum = expensePaymentMethods.reduce((acc, curr) => acc + curr.total, 0) || 1;
                const percentage = Math.round((pm.total / totalExpenseSum) * 100);
                return (
                  <div key={pm.method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{pm.method} ({pm.count} expenses)</span>
                      <span className="font-bold text-slate-900">{formatCurrency(pm.total, currency)} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: PAYMENT_COLORS[(idx + 2) % PAYMENT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No expense payments recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest sales invoices, supplier stock purchases, and operational expenses</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 uppercase tracking-wider font-bold">
                <th className="pb-3 pl-2">Date</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Particulars / Customer</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-2 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3">
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
                    <td className="py-3 text-slate-900 font-bold max-w-[220px] truncate">
                      {tx.name}
                    </td>
                    <td className="py-3 text-slate-600">{tx.paymentMethod}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right pr-2 font-black ${
                        tx.isCredit ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {tx.isCredit ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No transactions recorded yet. Use Quick Actions above to log your first sale or expense!
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
