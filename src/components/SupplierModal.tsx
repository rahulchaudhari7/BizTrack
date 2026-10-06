import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { Supplier } from '../types.ts';
import api from '../services/api.ts';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: Supplier | null;
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

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplierToEdit,
}) => {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('+977 ');
  const [email, setEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [province, setProvince] = useState('Bagmati Province');
  const [district, setDistrict] = useState('Kathmandu');
  const [municipality, setMunicipality] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setContactPerson(supplierToEdit.contactPerson || '');
      setPhone(supplierToEdit.phone || '+977 ');
      setEmail(supplierToEdit.email || '');
      setPanNumber(supplierToEdit.panNumber || '');
      setProvince(supplierToEdit.province || 'Bagmati Province');
      setDistrict(supplierToEdit.district || 'Kathmandu');
      setMunicipality(supplierToEdit.municipality || '');
      setAddress(supplierToEdit.address || '');
      setNotes(supplierToEdit.notes || '');
    } else {
      setName('');
      setContactPerson('');
      setPhone('+977 98');
      setEmail('');
      setPanNumber('');
      setProvince('Bagmati Province');
      setDistrict('Kathmandu');
      setMunicipality('');
      setAddress('');
      setNotes('');
    }
    setError(null);
  }, [supplierToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Supplier name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        panNumber: panNumber.trim(),
        province,
        district: district.trim(),
        municipality: municipality.trim(),
        address: address.trim() || `${municipality ? `${municipality}, ` : ''}${district}`,
        notes: notes.trim(),
      };

      if (supplierToEdit) {
        await api.put(`/suppliers/${supplierToEdit._id}`, payload);
      } else {
        await api.post('/suppliers', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save supplier details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplierToEdit ? 'Edit Supplier Details' : 'Add New Supplier'}
      subtitle="Store vendor contact info, PAN/VAT registration, and address for stock purchasing"
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
              Supplier / Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Himalayan Wholesale Traders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Person
            </label>
            <input
              type="text"
              placeholder="Manager or sales representative"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+977 98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Supplier PAN / VAT Number
            </label>
            <input
              type="text"
              placeholder="e.g. 600123987"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Province
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              District
            </label>
            <input
              type="text"
              placeholder="e.g. Kathmandu, Biratnagar"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Municipality / Area
            </label>
            <input
              type="text"
              placeholder="e.g. Kalimati, New Road"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Bank Payment Info
          </label>
          <textarea
            rows={2}
            placeholder="Account number, credit payment terms, return policy..."
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
            {loading ? 'Saving...' : supplierToEdit ? 'Update Supplier' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
