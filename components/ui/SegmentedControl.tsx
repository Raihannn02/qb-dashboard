'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function SegmentedControl({
  options,
  selectedValue,
  onChange,
  onRefresh,
  isLoading = false,
}: SegmentedControlProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="inline-flex p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-inner">
        {options.map((opt) => {
          const isActive = selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 select-none ${
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-subtle)] flex items-center justify-center transition-all duration-150 disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
}
