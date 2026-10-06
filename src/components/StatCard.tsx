import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'violet' | 'slate';
  badge?: {
    text: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  onClick?: () => void;
}

const colorStyles = {
  indigo: {
    bg: 'bg-indigo-50/70',
    iconBg: 'bg-indigo-600 text-white',
    border: 'border-indigo-100 hover:border-indigo-300',
    title: 'text-indigo-900',
    highlight: 'text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50/60',
    iconBg: 'bg-emerald-600 text-white',
    border: 'border-emerald-100 hover:border-emerald-300',
    title: 'text-emerald-950',
    highlight: 'text-emerald-600',
  },
  rose: {
    bg: 'bg-rose-50/60',
    iconBg: 'bg-rose-600 text-white',
    border: 'border-rose-100 hover:border-rose-300',
    title: 'text-rose-950',
    highlight: 'text-rose-600',
  },
  amber: {
    bg: 'bg-amber-50/60',
    iconBg: 'bg-amber-500 text-white',
    border: 'border-amber-100 hover:border-amber-300',
    title: 'text-amber-950',
    highlight: 'text-amber-600',
  },
  blue: {
    bg: 'bg-blue-50/60',
    iconBg: 'bg-blue-600 text-white',
    border: 'border-blue-100 hover:border-blue-300',
    title: 'text-blue-950',
    highlight: 'text-blue-600',
  },
  violet: {
    bg: 'bg-violet-50/60',
    iconBg: 'bg-violet-600 text-white',
    border: 'border-violet-100 hover:border-violet-300',
    title: 'text-violet-950',
    highlight: 'text-violet-600',
  },
  slate: {
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-700 text-white',
    border: 'border-slate-200 hover:border-slate-300',
    title: 'text-slate-900',
    highlight: 'text-slate-700',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  colorScheme = 'indigo',
  badge,
  onClick,
}) => {
  const styles = colorStyles[colorScheme] || colorStyles.indigo;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl bg-white border ${styles.border} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{amount}</h3>
        </div>
        <div className={`p-2.5 rounded-xl shadow-xs ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100/80">
        <div className="text-xs text-slate-500 truncate max-w-[70%]">{subtitle}</div>

        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
              badge.neutral
                ? 'bg-slate-100 text-slate-700'
                : badge.isPositive
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};
