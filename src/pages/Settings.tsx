import React, { useState, useEffect } from 'react';
import {
  Building,
  DollarSign,
  AlertTriangle,
  Lock,
  User,
  CheckCircle,
  Database,
  LogOut,
  RefreshCw,
  MapPin,
  Phone,
  FileText,
  CreditCard,
  Tag,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.ts';
import {
  NEPAL_PROVINCES,
  DISTRICTS_BY_PROVINCE,
  NEPAL_BUSINESS_TYPES,
  NEPAL_BUSINESS_CATEGORIES,
  NEPAL_PAYMENT_METHODS,
  NEPAL_BUSINESS_EXPENSE_CATEGORIES,
  CURRENCIES,
  formatNepalPhone,
  isValidNepalPhone,
  NepalProvince,
} from '../utils/nepalData.ts';

export const Settings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  // Nepal Business Profile fields
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [ownerName, setOwnerName] = useState(user?.ownerName || user?.name || '');
  const [businessType, setBusinessType] = useState(user?.businessType || 'Retail Shop');
  const [businessCategory, setBusinessCategory] = useState(user?.businessCategory || 'General Commerce');
  const [panNumber, setPanNumber] = useState(user?.panNumber || '');
  const [vatEnabled, setVatEnabled] = useState(user?.vatEnabled || false);
  const [vatNumber, setVatNumber] = useState(user?.vatNumber || '');
  const [vatRate, setVatRate] = useState((user?.vatRate || 13).toString());
  const [phone, setPhone] = useState(user?.phone || '+977 98');
  const [logoUrl, setLogoUrl] = useState(user?.logoUrl || '');

  // Nepal Address System
  const [province, setProvince] = useState<NepalProvince>(
    (user?.province as NepalProvince) || 'Bagmati Province'
  );
  const [district, setDistrict] = useState(user?.district || 'Kathmandu');
  const [municipality, setMunicipality] = useState(user?.municipality || 'Kathmandu Metropolitan City');
  const [wardNo, setWardNo] = useState(user?.wardNo || '10');
  const [tole, setTole] = useState(user?.tole || 'New Road');
  const [fullAddress, setFullAddress] = useState(user?.fullAddress || '');

  // Preferences
  const [currency, setCurrency] = useState(user?.currency || 'NPR');
  const [lowStockThreshold, setLowStockThreshold] = useState(
    (user?.lowStockThreshold || 5).toString()
  );
  const [fiscalYearType, setFiscalYearType] = useState(user?.fiscalYearType || 'nepal');

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    user?.paymentMethods && user.paymentMethods.length > 0
      ? user.paymentMethods
      : NEPAL_PAYMENT_METHODS
  );
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  // Custom Expense Categories
  const [customCategories, setCustomCategories] = useState<string[]>(
    user?.customExpenseCategories || []
  );
  const [newCustomCategory, setNewCustomCategory] = useState('');

  // Status indicators
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Demo data loading
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBusinessName(user.businessName || '');
      setOwnerName(user.ownerName || user.name || '');
      setBusinessType(user.businessType || 'Retail Shop');
      setBusinessCategory(user.businessCategory || 'General Commerce');
      setPanNumber(user.panNumber || '');
      setVatEnabled(Boolean(user.vatEnabled));
      setVatNumber(user.vatNumber || '');
      setVatRate((user.vatRate || 13).toString());
      setPhone(user.phone || '+977 98');
      setLogoUrl(user.logoUrl || '');
      setProvince((user.province as NepalProvince) || 'Bagmati Province');
      setDistrict(user.district || 'Kathmandu');
      setMunicipality(user.municipality || 'Kathmandu Metropolitan City');
      setWardNo(user.wardNo || '10');
      setTole(user.tole || 'New Road');
      setFullAddress(user.fullAddress || '');
      setCurrency(user.currency || 'NPR');
      setLowStockThreshold((user.lowStockThreshold || 5).toString());
      setFiscalYearType(user.fiscalYearType || 'nepal');
      if (user.paymentMethods && user.paymentMethods.length > 0) {
        setPaymentMethods(user.paymentMethods);
      }
      if (user.customExpenseCategories) {
        setCustomCategories(user.customExpenseCategories);
      }
    }
  }, [user]);

  // Update district options when province changes
  const availableDistricts = DISTRICTS_BY_PROVINCE[province] || [];

  const handleProvinceChange = (newProv: NepalProvince) => {
    setProvince(newProv);
    const districts = DISTRICTS_BY_PROVINCE[newProv];
    if (districts && districts.length > 0 && !districts.includes(district)) {
      setDistrict(districts[0]);
    }
  };

  const handleAddPaymentMethod = () => {
    const trimmed = newPaymentMethod.trim();
    if (!trimmed) return;
    if (paymentMethods.includes(trimmed)) {
      alert('This payment method already exists.');
      return;
    }
    setPaymentMethods([...paymentMethods, trimmed]);
    setNewPaymentMethod('');
  };

  const handleRemovePaymentMethod = (pm: string) => {
    if (pm === 'Cash') {
      alert('Cash is required as the default payment method and cannot be removed.');
      return;
    }
    setPaymentMethods(paymentMethods.filter((item) => item !== pm));
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCustomCategory.trim();
    if (!trimmed) return;
    if (
      customCategories.includes(trimmed) ||
      NEPAL_BUSINESS_EXPENSE_CATEGORIES.includes(trimmed)
    ) {
      alert('This category already exists.');
      return;
    }
    setCustomCategories([...customCategories, trimmed]);
    setNewCustomCategory('');
  };

  const handleRemoveCustomCategory = (cat: string) => {
    setCustomCategories(customCategories.filter((item) => item !== cat));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    // Build synthesized full address
    const computedFullAddress = fullAddress.trim()
      ? fullAddress.trim()
      : `${tole ? `${tole}, ` : ''}${wardNo ? `Ward ${wardNo}, ` : ''}${municipality ? `${municipality}, ` : ''}${district}, ${province}, Nepal`;

    try {
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        ownerName: ownerName.trim() || name.trim(),
        businessName: businessName.trim(),
        businessType: businessType.trim(),
        businessCategory: businessCategory.trim(),
        panNumber: panNumber.trim(),
        vatEnabled: Boolean(vatEnabled),
        vatNumber: vatNumber.trim(),
        vatRate: Number(vatRate) || 13,
        phone: formatNepalPhone(phone),
        province,
        district: district.trim(),
        municipality: municipality.trim(),
        wardNo: wardNo.trim(),
        tole: tole.trim(),
        fullAddress: computedFullAddress,
        currency,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        fiscalYearType,
        paymentMethods,
        customExpenseCategories: customCategories,
        logoUrl: logoUrl.trim(),
      });

      if (res.data?.user) {
        updateUser(res.data.user);
        setProfileSuccess('Nepal business profile and preferences saved successfully!');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLoadDemoData = async () => {
    if (!window.confirm('Populate authentic Nepal business records (Customers, Suppliers, Products in NPR, Sales, Purchases, and Expenses)?')) {
      return;
    }
    setDemoLoading(true);
    setDemoSuccess(null);
    try {
      await api.post('/auth/seed-demo');
      setDemoSuccess('Nepal demo transactions and stock data loaded successfully!');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to load demo data.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                Nepal Business Management Suite
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Business Profile & System Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your business legal identity, PAN/VAT registrations, Nepal address, local payment gateways, and accounting preferences.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Currency: Nepalese Rupee (रु NPR)
            </span>
          </div>
        </div>
      </div>

      {profileSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2.5 shadow-xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 shadow-xs">
          {profileError}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Section 1: Business Identity & Registration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                1. Business Identity & Legal Registration
              </h2>
              <p className="text-[11px] text-slate-500">
                Your business trade name, owner details, PAN and optional VAT information for invoices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business / Firm Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Everest Trading / Himalayan Organic Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Proprietor / Owner Name
              </label>
              <input
                type="text"
                placeholder="e.g. Aayush Shrestha"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                {NEPAL_BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business Category
              </label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                {NEPAL_BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PAN Number (Permanent Account Number)
              </label>
              <input
                type="text"
                placeholder="e.g. 601234567 (9 digits)"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                9-digit Inland Revenue Department (IRD) PAN
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Phone Number (+977 Nepal) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="+977 98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Primary Nepal contact number (98/97 series or landline)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Login / Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business Logo URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          {/* VAT Registration Toggle */}
          <div className="pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    VAT Registration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enable if your business is registered for VAT under Nepal IRD (13% Standard Rate).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vatEnabled}
                    onChange={(e) => setVatEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {vatEnabled && (
                <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      VAT Registration Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Same as PAN or separate VAT ID"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      VAT Rate % (Default 13%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Nepal Address System */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. Address Details
              </h2>
              <p className="text-[11px] text-slate-500">
                Configured with Nepal's 7 provinces, 77 districts, municipalities, wards, and toles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Province *
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value as NepalProvince)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer font-medium"
              >
                {NEPAL_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                District *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer font-medium"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Municipality / Local Body *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kathmandu Metropolitan City"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ward Number
              </label>
              <input
                type="text"
                placeholder="e.g. 10"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tole / Street Area
              </label>
              <input
                type="text"
                placeholder="e.g. Baneshwor / Lakeside / New Road"
                value={tole}
                onChange={(e) => setTole(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Country
              </label>
              <input
                type="text"
                disabled
                value="Nepal"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold shadow-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Custom Full Address Display (Optional override)
            </label>
            <input
              type="text"
              placeholder={`${tole ? `${tole}, ` : ''}${wardNo ? `Ward ${wardNo}, ` : ''}${municipality}, ${district}, ${province}, Nepal`}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* Section 3: Financial & Inventory Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                3. Financial & Accounting Preferences
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure currency, low-stock notifications, and Nepali fiscal year accounting.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer font-bold"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default: रु Nepalese Rupee (NPR)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Low-Stock Threshold (Units)
              </label>
              <input
                type="number"
                min="1"
                required
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Warning triggers when current stock is ≤ this amount
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fiscal Year Format
              </label>
              <select
                value={fiscalYearType}
                onChange={(e) => setFiscalYearType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer font-medium"
              >
                <option value="nepal">Nepal Fiscal Year (Shrawan 1 - Ashadh End)</option>
                <option value="english">Calendar Year (Jan 1 - Dec 31)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard Nepal tax & audit reporting cycle
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Payment Methods Used in Nepal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                4. Payment Methods & Gateways
              </h2>
              <p className="text-[11px] text-slate-500">
                Cash is the default. Includes Fonepay QR, eSewa, Khalti, IME Pay, ConnectIPS, and custom methods.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {paymentMethods.map((pm) => (
              <span
                key={pm}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  pm === 'Cash'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                    : ['eSewa', 'Khalti', 'Fonepay', 'IME Pay'].includes(pm)
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {pm}
                {pm === 'Cash' ? (
                  <span className="ml-1.5 text-[10px] text-emerald-600 uppercase font-black tracking-wider">
                    (Default)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRemovePaymentMethod(pm)}
                    className="ml-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove method"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2 max-w-md">
            <input
              type="text"
              placeholder="Add custom method (e.g. PrabhuPay, CellPay)"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
            <button
              type="button"
              onClick={handleAddPaymentMethod}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Section 5: Custom Expense Categories */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <Tag className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                5. Business Expense Categories
              </h2>
              <p className="text-[11px] text-slate-500">
                Standard Nepal expense categories are pre-loaded. Add custom categories below.
              </p>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Default Categories ({NEPAL_BUSINESS_EXPENSE_CATEGORIES.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              {NEPAL_BUSINESS_EXPENSE_CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 text-[11px] font-semibold"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {customCategories.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-2">
                Custom Categories Added ({customCategories.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {customCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-800"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomCategory(cat)}
                      className="ml-2 text-indigo-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1 max-w-md">
            <input
              type="text"
              placeholder="e.g. Dashain Bonus, Puja Expense, Staff Tiffin"
              value={newCustomCategory}
              onChange={(e) => setNewCustomCategory(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
            <button
              type="button"
              onClick={handleAddCustomCategory}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={profileSaving}
            className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{profileSaving ? 'Saving Nepal Profile...' : 'Save Business Settings'}</span>
          </button>
        </div>
      </form>

      {/* Google Account Security */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <Lock className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Google OAuth 2.0 Security & Identity</h2>
            <p className="text-[11px] text-slate-500">
              Authenticated securely via Google Identity Services. Passwordless login enabled.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-linear-to-tr from-indigo-600 to-emerald-500 text-white font-bold text-base flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500 font-medium">{user?.email}</div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Google SSO Active
                </span>
                <span className="text-[11px] text-slate-400">
                  ID: {user?.googleId || 'Managed by Google'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of BizTrack</span>
          </button>
        </div>
      </div>

      {/* Demo Data & Reset */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Nepal Demo Data & Initialization</h2>
            <p className="text-[11px] text-slate-500">
              Populate realistic sample inventory (Pashmina, Organic Tea, Handicrafts, Mobile Accessories), customers, suppliers, and sales in Nepalese Rupee.
            </p>
          </div>
        </div>

        {demoSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{demoSuccess}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Seed Authentic Nepal Business Records</h3>
            <p className="text-[11px] text-slate-500">
              Populates products, customers with Ward/Tole, suppliers, and transactions in रु NPR.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadDemoData}
            disabled={demoLoading}
            className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${demoLoading ? 'animate-spin' : ''}`} />
            <span>{demoLoading ? 'Seeding...' : 'Load Nepal Sample Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
