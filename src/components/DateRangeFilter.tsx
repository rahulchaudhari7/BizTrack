import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface DateFilterState {
  range: 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_fiscal_year' | 'last_fiscal_year' | 'custom';
  startDate?: string;
  endDate?: string;
}

interface DateRangeFilterProps {
  value: DateFilterState;
  onChange: (val: DateFilterState) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate || '');
  const [customEnd, setCustomEnd] = useState(value.endDate || '');

  const options: Array<{ label: string; value: DateFilterState['range'] }> = [
    { label: 'All Time (सबै समय)', value: 'all' },
    { label: 'Today (आज)', value: 'today' },
    { label: 'This Week (यो हप्ता)', value: 'this_week' },
    { label: 'This Month (यो महिना)', value: 'this_month' },
    { label: 'Last Month (गत महिना)', value: 'last_month' },
    { label: 'This Fiscal Year (चालू आ.व.)', value: 'this_fiscal_year' },
    { label: 'Last Fiscal Year (गत आ.व.)', value: 'last_fiscal_year' },
    { label: 'Custom Range...', value: 'custom' },
  ];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as DateFilterState['range'];
    if (val === 'custom') {
      setShowCustomModal(true);
    } else {
      onChange({ range: val });
    }
  };

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      onChange({
        range: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      setShowCustomModal(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-500">
          <Calendar className="w-4 h-4 text-indigo-600" />
        </div>
        <select
          value={value.range}
          onChange={handleSelectChange}
          className="appearance-none pl-9 pr-9 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer transition-all"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
      </div>

      {value.range === 'custom' && value.startDate && value.endDate && (
        <span className="ml-2 text-xs font-medium text-slate-500 hidden sm:inline-block">
          ({value.startDate} to {value.endDate})
        </span>
      )}

      {/* Custom Range Popover */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 max-w-sm w-full">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Select Custom Date Range</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={!customStart || !customEnd}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
