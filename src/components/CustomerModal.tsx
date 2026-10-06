import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { Customer } from '../types.ts';
import api from '../services/api.ts';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: Customer | null;
}

const PROVINCES = [
  'Koshi Province',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province',
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+977 ');
  const [email, setEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [province, setProvince] = useState('Bagmati Province');
  const [district, setDistrict] = useState('Kathmandu');
  const [municipality, setMunicipality] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [tole, setTole] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone || '+977 ');
      setEmail(customerToEdit.email || '');
      setPanNumber(customerToEdit.panNumber || '');
      setProvince(customerToEdit.province || 'Bagmati Province');
      setDistrict(customerToEdit.district || 'Kathmandu');
      setMunicipality(customerToEdit.municipality || '');
      setWardNo(customerToEdit.wardNo || '');
      setTole(customerToEdit.tole || '');
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setPhone('+977 98');
      setEmail('');
      setPanNumber('');
      setProvince('Bagmati Province');
      setDistrict('Kathmandu');
      setMunicipality('');
      setWardNo('');
      setTole('');
      setNotes('');
    }
    setError(null);
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        panNumber: panNumber.trim(),
        province,
        district: district.trim(),
        municipality: municipality.trim(),
        wardNo: wardNo.trim(),
        tole: tole.trim(),
        address: `${tole ? `${tole}, ` : ''}${wardNo ? `Ward ${wardNo}, ` : ''}${municipality ? `${municipality}, ` : ''}${district}`,
        notes: notes.trim(),
      };

      if (customerToEdit) {
        await api.put(`/customers/${customerToEdit._id}`, payload);
      } else {
        await api.post('/customers', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save customer details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Edit Customer Details' : 'Add New Customer (नयाँ ग्राहक)'}
      subtitle="Store contact information, PAN, and address for sales and credit tracking"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aayush Shrestha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nepal Mobile Number
            </label>
            <input
              type="text"
              placeholder="+977 98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer PAN Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 601234567"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="client@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* Nepal Address Section */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-800 block uppercase tracking-wider">
            Nepal Address System (ठेगाना)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Province (प्रदेश)</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">District (जिल्ला)</label>
              <input
                type="text"
                placeholder="e.g. Kathmandu, Kaski, Chitwan"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Municipality (पालिका)</label>
              <input
                type="text"
                placeholder="e.g. Kathmandu Metro"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Ward No. (वडा)</label>
              <input
                type="text"
                placeholder="e.g. 10"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tole / Area (टोल)</label>
              <input
                type="text"
                placeholder="e.g. New Baneshwor"
                value={tole}
                onChange={(e) => setTole(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Reference
          </label>
          <textarea
            rows={2}
            placeholder="Credit terms, business preferences, delivery instructions..."
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
            {loading ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Save Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
