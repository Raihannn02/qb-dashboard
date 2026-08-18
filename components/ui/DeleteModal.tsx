'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Archive } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  onConfirmDeactivate?: () => void;
  title: string;
  itemName: string;
  itemType?: string;
  hasHistoricalRecords?: boolean;
  isDeleting?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirmDelete,
  onConfirmDeactivate,
  title,
  itemName,
  itemType = 'record',
  hasHistoricalRecords = false,
  isDeleting = false,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-md">
        <div className="modal-header">
          <div className="flex items-center gap-2.5 text-[var(--danger)] font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-[var(--danger-bg)] flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon text-[var(--text-muted)]">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body space-y-3">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">"{itemName}"</span>?
          </p>

          {hasHistoricalRecords ? (
            <div className="p-3.5 rounded-xl bg-[var(--warning-bg)] border border-amber-500/20 text-amber-200 text-xs space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                Historical Dependencies Found
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                This {itemType} has historical transactions or stock logs and cannot be permanently removed without disrupting financial reporting. We recommend deactivating it instead.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--danger)] font-medium">
              This action is permanent and cannot be undone.
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} disabled={isDeleting} className="btn btn-secondary text-xs">
            Cancel
          </button>

          {hasHistoricalRecords && onConfirmDeactivate ? (
            <button
              onClick={onConfirmDeactivate}
              disabled={isDeleting}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <Archive size={14} />
              Deactivate {itemType}
            </button>
          ) : (
            <button
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="btn btn-danger text-xs flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              {isDeleting ? 'Deleting...' : `Delete ${itemType}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
