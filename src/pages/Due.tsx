import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  User,
  Building,
  Phone,
} from 'lucide-react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DueSettlementModal } from '../components/DueSettlementModal.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

export const Due: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables');
  const [loading, setLoading] = useState(true);
  const [dueData, setDueData] = useState<any>(null);
  const [search, setSearch] = useState('');

  // Settlement Modal target
  const [settleTarget, setSettleTarget] = useState<any>(null);

  const fetchDueData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/due/summary');
      if (res.data) {
        setDueData(res.data);
      }
    } catch (err) {
      console.error('Failed to load due summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueData();
  }, []);

  const currency = user?.currencySymbol || 'रु';
  const summary = dueData?.summary || { totalReceivable: 0, totalPayable: 0, netDueBalance: 0 };

  const customerDues = dueData?.customerDues || [];
  const supplierDues = dueData?.supplierDues || [];
  const receivableSales = dueData?.receivableSales || [];
  const payablePurchases = dueData?.payablePurchases || [];

  const filteredCustomerDues = customerDues.filter((c: any) =>
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    (c.customerPhone && c.customerPhone.includes(search))
  );

  const filteredSupplierDues = supplierDues.filter((s: any) =>
    s.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    (s.supplierPhone && s.supplierPhone.includes(search))
  );

  const handleExportCSV = () => {
    if (activeTab === 'receivables') {
      const rows = receivableSales.map((s: any) => ({
        'Invoice Number': s.invoiceNumber,
        'Customer Name': s.customerName,
        'Customer Phone': s.customerPhone || '',
        'Sale Date': formatDate(s.saleDate),
        'Total Invoice Amount': s.totalAmount,
        'Amount Paid': s.amountPaid,
        'Outstanding Due to Receive': s.amountDue,
        'Payment Status': s.paymentStatus,
      }));
      exportToCSV(rows, 'money_to_receive_customers');
    } else {
      const rows = payablePurchases.map((p: any) => ({
        'Bill / Invoice Number': p.billNumber || '-',
        'Supplier Name': p.supplier,
        'Supplier Phone': p.supplierPhone || '',
        'Purchase Date': formatDate(p.purchaseDate),
        'Total Bill Cost': p.totalPurchaseCost,
        'Amount Paid': p.amountPaid,
        'Outstanding Due to Pay': p.amountDue,
        'Payment Status': p.paymentStatus,
      }));
      exportToCSV(rows, 'money_to_pay_suppliers');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Credit Bookkeeping & Cash Collection (उधारो हिसाब किताब)
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Due / Receivables & Payables
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track money to receive from customers and money to pay to wholesale suppliers
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Dues CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Money to Receive */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Money to Receive (उठ्न बाँकी)
            </span>
            <h3 className="text-2xl font-black text-emerald-950 mt-1">
              {formatCurrency(summary.totalReceivable, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {customerDues.length} customers with pending payments
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Money to Pay */}
        <div className="p-5 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Money to Pay (साहुलाई तिर्न बाँकी)
            </span>
            <h3 className="text-2xl font-black text-rose-950 mt-1">
              {formatCurrency(summary.totalPayable, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {supplierDues.length} suppliers with outstanding credit
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Net Due Position */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Net Credit Balance Position
            </span>
            <h3
              className={`text-2xl font-black mt-1 ${
                summary.netDueBalance >= 0 ? 'text-indigo-700' : 'text-rose-700'
              }`}
            >
              {summary.netDueBalance >= 0 ? '+' : ''}
              {formatCurrency(summary.netDueBalance, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary.netDueBalance >= 0 ? 'Receivables exceed payables' : 'Payables exceed receivables'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'receivables'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📥 Money to Receive ({formatCurrency(summary.totalReceivable, currency)})
            </button>
            <button
              onClick={() => setActiveTab('payables')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'payables'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📤 Money to Pay ({formatCurrency(summary.totalPayable, currency)})
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'receivables' ? 'customers' : 'suppliers'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: Money to Receive (Customer-wise dues & pending invoices) */}
      {activeTab === 'receivables' && (
        <div className="space-y-4">
          {/* Customer Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomerDues.map((c: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.customerName}</h4>
                      {c.customerPhone && (
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.customerPhone}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {c.pendingInvoices} invoice(s)
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total Outstanding:</span>
                    <span className="text-base font-black text-rose-600">
                      {formatCurrency(c.totalDue, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Sales Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Unpaid / Partially Paid Customer Invoices
              </h3>
              <span className="text-xs text-slate-500">
                {receivableSales.length} pending records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 pl-4">Invoice #</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Customer</th>
                    <th className="py-3 text-right">Invoice Total</th>
                    <th className="py-3 text-right">Paid</th>
                    <th className="py-3 text-right">Due to Receive</th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 text-center pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {receivableSales.length > 0 ? (
                    receivableSales.map((s: any) => (
                      <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-4 font-mono font-bold text-indigo-700">
                          {s.invoiceNumber}
                        </td>
                        <td className="py-3 text-slate-500">{formatDate(s.saleDate)}</td>
                        <td className="py-3 text-slate-900 font-bold">{s.customerName}</td>
                        <td className="py-3 text-right text-slate-700">{formatCurrency(s.totalAmount, currency)}</td>
                        <td className="py-3 text-right text-emerald-700">{formatCurrency(s.amountPaid, currency)}</td>
                        <td className="py-3 text-right font-black text-rose-600">
                          {formatCurrency(s.amountDue, currency)}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.paymentStatus === 'Due'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-center pr-4">
                          <button
                            onClick={() =>
                              setSettleTarget({
                                type: 'sale',
                                id: s._id,
                                title: `Invoice ${s.invoiceNumber}`,
                                partyName: s.customerName,
                                totalAmount: s.totalAmount,
                                amountPaid: s.amountPaid,
                                amountDue: s.amountDue,
                              })
                            }
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Receive Payment
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        🎉 All customer receivables are cleared! No outstanding customer dues.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Money to Pay (Supplier-wise dues & pending bills) */}
      {activeTab === 'payables' && (
        <div className="space-y-4">
          {/* Supplier Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSupplierDues.map((s: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{s.supplierName}</h4>
                      {s.supplierPhone && (
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.supplierPhone}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {s.pendingBills} bill(s)
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Payable Amount:</span>
                    <span className="text-base font-black text-rose-700">
                      {formatCurrency(s.totalDue, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Purchase Bills Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Unpaid / Partially Paid Supplier Bills
              </h3>
              <span className="text-xs text-slate-500">
                {payablePurchases.length} bills pending settlement
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 pl-4">Bill #</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Supplier</th>
                    <th className="py-3">Item</th>
                    <th className="py-3 text-right">Bill Total</th>
                    <th className="py-3 text-right">Paid</th>
                    <th className="py-3 text-right">Due to Pay</th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 text-center pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payablePurchases.length > 0 ? (
                    payablePurchases.map((p: any) => (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-4 font-mono font-bold text-slate-700">
                          {p.billNumber || '-'}
                        </td>
                        <td className="py-3 text-slate-500">{formatDate(p.purchaseDate)}</td>
                        <td className="py-3 text-slate-900 font-bold">{p.supplier}</td>
                        <td className="py-3 text-slate-600">{p.productName}</td>
                        <td className="py-3 text-right text-slate-700">{formatCurrency(p.totalPurchaseCost, currency)}</td>
                        <td className="py-3 text-right text-emerald-700">{formatCurrency(p.amountPaid, currency)}</td>
                        <td className="py-3 text-right font-black text-rose-700">
                          {formatCurrency(p.amountDue, currency)}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.paymentStatus === 'Due'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-center pr-4">
                          <button
                            onClick={() =>
                              setSettleTarget({
                                type: 'purchase',
                                id: p._id,
                                title: `Bill ${p.billNumber || p.productName}`,
                                partyName: p.supplier,
                                totalAmount: p.totalPurchaseCost,
                                amountPaid: p.amountPaid,
                                amountDue: p.amountDue,
                              })
                            }
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Pay Due
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        🎉 All supplier payables are cleared! No outstanding supplier dues.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settle Payment Modal */}
      <DueSettlementModal
        isOpen={Boolean(settleTarget)}
        onClose={() => setSettleTarget(null)}
        onSuccess={fetchDueData}
        target={settleTarget}
      />
    </div>
  );
};
