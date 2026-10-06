import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
} from 'lucide-react';
import api from '../services/api.ts';
import { Customer } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { CustomerModal } from '../components/CustomerModal.tsx';
import { DueSettlementModal } from '../components/DueSettlementModal.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');

  // Settlement Modal
  const [settlementTarget, setSettlementTarget] = useState<any>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/customers', { params });
      if (res.data?.customers) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;

    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      alert('Unable to delete customer.');
    }
  };

  const handleExportCSV = () => {
    const rows = customers.map((c) => ({
      'Customer Name': c.name,
      'Phone': c.phone,
      'Email': c.email || '',
      'PAN Number': c.panNumber || '',
      'Province': c.province || '',
      'District': c.district || '',
      'Municipality': c.municipality || '',
      'Total Purchases': c.totalPurchases,
      'Total Invoices': c.transactionCount,
      'Outstanding Due': c.totalDue,
      'Last Purchase': formatDate(c.lastPurchaseDate),
    }));
    exportToCSV(rows, 'nepal_customers_directory');
  };

  const currency = user?.currencySymbol || 'रु';
  const totalReceivables = customers.reduce((acc, c) => acc + (c.totalDue || 0), 0);
  const totalLifetimeSales = customers.reduce((acc, c) => acc + (c.totalPurchases || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Customer Directory (ग्राहक खाता)
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain customer contact details, Nepal addresses, PAN numbers, and credit balances
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
              setCustomerToEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Customers
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {customers.length} clients
          </span>
          <span className="text-xs text-slate-500">Registered in Nepal</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Lifetime Customer Purchases
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {formatCurrency(totalLifetimeSales, currency)}
          </span>
          <span className="text-xs text-slate-500">Gross revenue generated</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">
            Total Customer Dues (उठ्न बाँकी)
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            {formatCurrency(totalReceivables, currency)}
          </span>
          <span className="text-xs text-slate-500">Outstanding credit to collect</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, mobile number, PAN, district or municipality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Customer Details</th>
                <th className="py-3.5">Contact & PAN</th>
                <th className="py-3.5">Nepal Address</th>
                <th className="py-3.5 text-right">Total Purchases</th>
                <th className="py-3.5 text-center">Orders</th>
                <th className="py-3.5 text-right">Due Balance</th>
                <th className="py-3.5 text-center pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      {c.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-700">
                      <div>{c.phone || '-'}</div>
                      {c.panNumber && (
                        <div className="text-[11px] text-slate-400 font-mono">PAN: {c.panNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {c.municipality || c.tole ? `${c.tole ? `${c.tole}, ` : ''}${c.municipality ? `${c.municipality}, ` : ''}` : ''}
                          {c.district}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(c.totalPurchases, currency)}
                    </td>
                    <td className="py-3.5 text-center text-slate-700 font-bold">
                      {c.transactionCount || 0}
                    </td>
                    <td className="py-3.5 text-right">
                      {c.totalDue > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                          {formatCurrency(c.totalDue, currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Clear (0)</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center pr-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setCustomerToEdit(c);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Customer"
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
                    No customer accounts found. Click "Add Customer" to create your first client ledger!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSuccess={fetchCustomers}
        customerToEdit={customerToEdit}
      />
    </div>
  );
};
