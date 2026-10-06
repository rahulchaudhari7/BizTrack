import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  PieChart as PieIcon,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  MonthlyDataPoint,
  CategoryDataPoint,
  ProductPerformanceItem,
  DashboardSummary,
} from '../types.ts';
import {
  formatCurrency,
  generateFinancialPDFReport,
  exportToCSV,
} from '../utils/formatters.ts';

const CATEGORY_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#64748b'];

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [categories, setCategories] = useState<CategoryDataPoint[]>([]);
  const [performance, setPerformance] = useState<ProductPerformanceItem[]>([]);
  const [highlights, setHighlights] = useState<any>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const [monthlyRes, catRes, prodRes, summaryRes] = await Promise.all([
        api.get('/dashboard/monthly'),
        api.get('/dashboard/categories'),
        api.get('/dashboard/products'),
        api.get('/dashboard/summary'),
      ]);

      if (monthlyRes.data?.monthlyData) setMonthlyData(monthlyRes.data.monthlyData);
      if (catRes.data?.categories) setCategories(catRes.data.categories);
      if (prodRes.data) {
        setPerformance(prodRes.data.performanceList || []);
        setHighlights(prodRes.data.highlights || {});
      }
      if (summaryRes.data?.summary) setSummary(summaryRes.data.summary);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const currency = user?.currencySymbol || 'रु';

  const handleExportPDF = () => {
    if (!summary) return;
    generateFinancialPDFReport(
      {
        businessName: user?.businessName || 'BizTrack Business',
        currencySymbol: currency,
        municipality: user?.municipality || 'Kathmandu',
      },
      summary,
      monthlyData,
      categories,
      performance
    );
  };

  const handleExportPerformanceCSV = () => {
    const rows = performance.map((p) => ({
      'Product Name': p.name,
      'Category': p.category,
      'Current Stock': p.currentStock,
      'Units Sold': p.totalUnitsSold,
      'Buying Price': p.buyingPrice,
      'Selling Price': p.sellingPrice,
      'Total Revenue': p.totalRevenue,
      'Total Profit': p.totalProfit,
      'Profit Margin %': p.profitMargin,
    }));
    exportToCSV(rows, 'product_performance_analytics');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Business Intelligence
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reports & Financial Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep dive into monthly revenue trends, expense structures, profit margins, and SKU performance
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPerformanceCSV}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export Full PDF Report</span>
          </button>
        </div>
      </div>

      {/* Top Product Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Best Selling */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Best-Selling Product
            </span>
            <h4 className="text-base font-black text-slate-900 mt-1 truncate max-w-[180px]">
              {highlights?.bestSelling?.name || 'No Sales Yet'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {highlights?.bestSelling
                ? `${highlights.bestSelling.totalUnitsSold} units sold (${formatCurrency(highlights.bestSelling.totalRevenue, currency)})`
                : 'Pending sales'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Highest Profit Product */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Highest-Profit Earner
            </span>
            <h4 className="text-base font-black text-slate-900 mt-1 truncate max-w-[180px]">
              {highlights?.highestProfit?.name || 'No Data'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {highlights?.highestProfit
                ? `+${formatCurrency(highlights.highestProfit.totalProfit, currency)} net profit`
                : 'Pending profits'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Lowest Profit / Slow Product */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Lowest-Profit Product
            </span>
            <h4 className="text-base font-black text-slate-900 mt-1 truncate max-w-[180px]">
              {highlights?.lowestProfit?.name || 'All High Performers'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {highlights?.lowestProfit
                ? `${formatCurrency(highlights.lowestProfit.totalProfit, currency)} profit (${highlights.lowestProfit.profitMargin}% margin)`
                : 'Balanced margin'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Chart Grid: Monthly Profit/Loss & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Net Profit/Loss Chart */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Net Profit / Loss</h3>
              <p className="text-xs text-slate-500">True commercial net returns over time</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              Profit / Loss
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), currency), 'Net Return']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar
                  dataKey="netProfit"
                  name="Net Profit / Loss"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.netProfit >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue vs Total Expenses Line/Bar Chart */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue vs Operating Outflows</h3>
              <p className="text-xs text-slate-500">Income compared with operational burn</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
              Cash Flow
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Gross Income"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalExpense"
                  name="Total Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expense Categories Chart */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cost Structure by Category</h3>
            <p className="text-xs text-slate-500">
              Breakdown across Rent, Transport, Marketing, Product Stock, Salaries, and Personal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="h-64 w-full md:col-span-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value), currency), 'Expenditure']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-2 space-y-2">
            {categories.map((c, i) => {
              const totalCost = categories.reduce((sum, item) => sum + item.value, 0);
              const percent = totalCost > 0 ? ((c.value / totalCost) * 100).toFixed(1) : '0';
              return (
                <div key={c.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="text-slate-400">({c.count} records)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-900">{formatCurrency(c.value, currency)}</span>
                    <span className="font-mono text-[11px] text-slate-500 w-12 text-right">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comprehensive Product Performance Table */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Product Line Performance & Stock Health</h3>
            <p className="text-xs text-slate-500">Unit sales, inventory on hand, and realized profit margins</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 pl-3">Product Name</th>
                <th className="py-3">Category</th>
                <th className="py-3 text-center">Current Stock</th>
                <th className="py-3 text-center">Units Sold</th>
                <th className="py-3 text-right">Selling Price</th>
                <th className="py-3 text-right">Gross Revenue</th>
                <th className="py-3 text-right">Realized Profit</th>
                <th className="py-3 text-right pr-3">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {performance.length > 0 ? (
                performance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-3 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 text-slate-600">{item.category || 'General'}</td>
                    <td className="py-3 text-center font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          item.currentStock <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : item.currentStock <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.currentStock} units
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-800 font-bold">{item.totalUnitsSold}</td>
                    <td className="py-3 text-right text-slate-600">
                      {formatCurrency(item.sellingPrice, currency)}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.totalRevenue, currency)}
                    </td>
                    <td
                      className={`py-3 text-right font-black ${
                        item.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      +{formatCurrency(item.totalProfit, currency)}
                    </td>
                    <td className="py-3 text-right pr-3 font-bold text-indigo-700">
                      {item.profitMargin}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No product performance data available yet.
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
