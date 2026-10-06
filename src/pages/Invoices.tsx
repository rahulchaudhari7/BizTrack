import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api.ts';
import { Sale } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SaleModal } from '../components/SaleModal.tsx';
import { DateRangeFilter, DateFilterState } from '../components/DateRangeFilter.tsx';
import { formatCurrency, formatDate, toBSDate, generateInvoicePDF } from '../utils/formatters.ts';

export const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ range: 'all' });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = { sortBy: 'saleDate', sortOrder: 'desc' };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'All') params.paymentStatus = statusFilter;
      if (dateFilter.range !== 'all') params.dateRange = dateFilter.range;
      if (dateFilter.range === 'custom') {
        params.startDate = dateFilter.startDate;
        params.endDate = dateFilter.endDate;
      }

      const res = await api.get('/sales', { params });
      if (res.data?.sales) {
        setSales(res.data.sales);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter, dateFilter]);

  const currency = user?.currencySymbol || 'रु';
  const totalBilled = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalDueToCollect = sales.reduce((acc, s) => acc + (s.amountDue || 0), 0);

  const handleDownloadPDF = (sale: Sale) => {
    generateInvoicePDF(user, sale);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Billing & Invoicing
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sales Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate, print, and download official Nepal Tax Invoices with PAN/VAT compliance and BS dates
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice / Bill</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Invoices Issued
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {sales.length} invoices
          </span>
          <span className="text-xs text-slate-500">Commercial billing records</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Invoiced Amount
          </span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">
            {formatCurrency(totalBilled, currency)}
          </span>
          <span className="text-xs text-slate-500">Gross billing total</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">
            Uncollected Due on Invoices
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            {formatCurrency(totalDueToCollect, currency)}
          </span>
          <span className="text-xs text-slate-500">Pending customer collection</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by invoice number (e.g. INV-2081-0001), customer, product, or PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Due">Unpaid / Due</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Invoice #</th>
                <th className="py-3.5">Date (AD / BS)</th>
                <th className="py-3.5">Customer Name & PAN</th>
                <th className="py-3.5">Particulars</th>
                <th className="py-3.5 text-right">Subtotal</th>
                <th className="py-3.5 text-right">Grand Total</th>
                <th className="py-3.5 text-center">Status</th>
                <th className="py-3.5 text-center pr-4">Download PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-4 font-mono font-bold text-indigo-700">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 text-slate-600">
                      <div className="font-bold">{formatDate(sale.saleDate)}</div>
                      <div className="text-[11px] text-slate-400">{toBSDate(sale.saleDate)}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{sale.customerName}</div>
                      {sale.customerPan && (
                        <div className="text-[11px] text-slate-400 font-mono">PAN: {sale.customerPan}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-700">
                      <div>
                        {sale.productName} ({sale.quantity} {sale.unit || 'Piece'})
                      </div>
                    </td>
                    <td className="py-3.5 text-right text-slate-700">
                      {formatCurrency(sale.subtotal, currency)}
                    </td>
                    <td className="py-3.5 text-right font-black text-indigo-950 text-sm">
                      {formatCurrency(sale.totalAmount, currency)}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentStatus === 'Due'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-center pr-4">
                      <button
                        onClick={() => handleDownloadPDF(sale)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-all cursor-pointer"
                        title="Download official Nepal PDF invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales invoices found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
};
