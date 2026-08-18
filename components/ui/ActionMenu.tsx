'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: any;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  label?: string;
}

export default function ActionMenu({ items, label }: ActionMenuProps) {
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
        className="action-menu-btn"
        title="Actions"
      >
        {label ? (
          <span className="text-xs font-semibold">{label}</span>
        ) : (
          <MoreHorizontal size={15} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl z-50 py-1.5 backdrop-blur-md animate-scaleUp">
          {items.map((item, index) => {
            const isDanger = item.variant === 'danger';
            const isWarning = item.variant === 'warning';
            return (
              <button
                key={index}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : isDanger
                    ? 'text-[var(--danger)] hover:bg-[var(--danger-bg)]'
                    : isWarning
                    ? 'text-[var(--warning)] hover:bg-[var(--warning-bg)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]'
                }`}
              >
                {item.icon && <item.icon size={15} className="shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
