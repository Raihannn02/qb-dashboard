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
    <div className={`empty-state-wrapper ${compact ? 'compact' : ''}`}>
      <div className="empty-state-icon-box">
        <Icon size={22} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary btn-sm mt-3">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="btn btn-primary btn-sm mt-3">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
