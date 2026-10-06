import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';
import api from '../services/api.ts';
import { Supplier } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SupplierModal } from '../components/SupplierModal.tsx';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters.ts';

export const Suppliers: React.FC = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/suppliers', { params });
      if (res.data?.suppliers) {
        setSuppliers(res.data.suppliers);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;

    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      alert('Unable to delete supplier.');
    }
  };

  const handleExportCSV = () => {
    const rows = suppliers.map((s) => ({
      'Supplier Name': s.name,
      'Contact Person': s.contactPerson || '',
      'Phone': s.phone,
      'Email': s.email || '',
      'PAN / VAT': s.panNumber || '',
      'Province': s.province || '',
      'District': s.district || '',
      'Address': s.address || '',
      'Total Purchases': s.totalPurchases,
      'Purchase Orders': s.purchaseCount,
      'Outstanding Due to Pay': s.totalDue,
      'Last Purchase': formatDate(s.lastPurchaseDate),
    }));
    exportToCSV(rows, 'nepal_suppliers_directory');
  };

  const currency = user?.currencySymbol || 'रु';
  const totalPayables = suppliers.reduce((acc, s) => acc + (s.totalDue || 0), 0);
  const totalPurchasesSum = suppliers.reduce((acc, s) => acc + (s.totalPurchases || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Vendor & Supplier Directory
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Supplier Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage wholesale distributors, stock vendors, PAN/VAT registrations, and payment obligations
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
              setSupplierToEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Active Suppliers
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {suppliers.length} vendors
          </span>
          <span className="text-xs text-slate-500">Commercial supply partners</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Total Sourced Outlays
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">
            {formatCurrency(totalPurchasesSum, currency)}
          </span>
          <span className="text-xs text-slate-500">All-time stock purchases</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
            Accounts Payable (Supplier Due)
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">
            {formatCurrency(totalPayables, currency)}
          </span>
          <span className="text-xs text-slate-500">Pending vendor payments</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by supplier name, contact person, phone, PAN/VAT, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 pl-4">Supplier Name</th>
                <th className="py-3.5">Contact Person</th>
                <th className="py-3.5">Phone & PAN/VAT</th>
                <th className="py-3.5">Location</th>
                <th className="py-3.5 text-right">Total Purchases</th>
                <th className="py-3.5 text-right">Due to Pay</th>
                <th className="py-3.5 text-center pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {suppliers.length > 0 ? (
                suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      {s.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-700">
                      {s.contactPerson || '-'}
                    </td>
                    <td className="py-3.5 text-slate-700">
                      <div>{s.phone || '-'}</div>
                      {s.panNumber && (
                        <div className="text-[11px] text-slate-400 font-mono">PAN: {s.panNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{s.district}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(s.totalPurchases, currency)}
                    </td>
                    <td className="py-3.5 text-right">
                      {s.totalDue > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900">
                          {formatCurrency(s.totalDue, currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Settled (0)</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center pr-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setSupplierToEdit(s);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id, s.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Supplier"
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
                    No supplier records found. Click "Add Supplier" to register your vendor partners!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSuccess={fetchSuppliers}
        supplierToEdit={supplierToEdit}
      />
    </div>
  );
};
