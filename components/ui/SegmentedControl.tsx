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
    <div className="segmented-control-wrapper">
      <div className="segmented-control">
        {options.map((opt) => {
          const isActive = selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`segmented-control-item ${isActive ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="segmented-control-refresh"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
}
