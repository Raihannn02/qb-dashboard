'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit3, Trash2, Copy, Layers, Power, RefreshCw } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: any;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export default function ActionMenu({ items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg bg-transparent hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors"
        title="More Actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl z-50 py-1.5 animation-fadeIn">
          {items.map((item, index) => {
            const isDanger = item.variant === 'danger';
            const isWarning = item.variant === 'warning';
            return (
              <button
                key={index}
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : isDanger
                    ? 'text-[var(--danger)] hover:bg-[var(--danger-bg)]'
                    : isWarning
                    ? 'text-[var(--warning)] hover:bg-[var(--warning-bg)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {item.icon && <item.icon size={14} className="shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
