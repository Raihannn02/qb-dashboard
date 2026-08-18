'use client';

import React from 'react';
import { LucideIcon, PackageX } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon = PackageX,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-12 px-6'} rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/50`}>
      <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center mb-3 shadow-sm">
        <Icon size={22} />
      </div>
      <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">{title}</h4>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mb-4 leading-relaxed">{description}</p>
      
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary btn-sm shadow-md">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="btn btn-primary btn-sm shadow-md">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
