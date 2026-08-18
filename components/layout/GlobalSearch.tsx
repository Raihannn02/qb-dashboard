'use client';

import { useState, useEffect } from 'react';
import { Search, X, Package, ArrowUpRight, Smartphone, User, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  type: 'product' | 'transaction' | 'account' | 'rf';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodRes, accRes, rfRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(query)}`).then(r => r.json()),
          fetch(`/api/accounts?search=${encodeURIComponent(query)}`).then(r => r.json()),
          fetch('/api/rf-devices').then(r => r.json()),
        ]);

        const items: SearchResult[] = [];

        // Products
        (prodRes.products || []).slice(0, 4).forEach((p: any) => {
          items.push({
            type: 'product',
            id: p.id,
            title: p.name,
            subtitle: `${p.product_code} • ${p.category}`,
            url: `/products`,
          });
        });

        // Accounts
        (accRes.accounts || []).slice(0, 4).forEach((a: any) => {
          items.push({
            type: 'account',
            id: a.id,
            title: a.username,
            subtitle: `Device: ${a.rf_name || 'Unassigned'}`,
            url: `/accounts`,
          });
        });

        // RF Devices
        (rfRes.rfDevices || [])
          .filter((d: any) => d.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .forEach((d: any) => {
            items.push({
              type: 'rf',
              id: d.id,
              title: d.name,
              subtitle: `${d.account_count || 0} Accounts • Rp ${parseFloat(d.monthly_cost).toLocaleString()}/mo`,
              url: `/rf-devices`,
            });
          });

        setResults(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal max-w-xl overflow-hidden p-0"
        onClick={e => e.stopPropagation()}
        style={{ marginTop: '-10vh' }}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <Search size={18} className="text-[var(--text-muted)]" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            placeholder="Search products, accounts, RF devices... (Press Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="p-4 text-center text-xs text-[var(--text-muted)] animate-pulse">
              Searching QB database...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
              No results found for "{query}"
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              Type a product name, Roblox account username, or RF device code to search.
            </div>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-1">
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={onClose}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border)]">
                      {item.type === 'product' && <Package size={16} />}
                      {item.type === 'account' && <User size={16} />}
                      {item.type === 'rf' && <Smartphone size={16} />}
                      {item.type === 'transaction' && <DollarSign size={16} />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{item.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex justify-between items-center text-[10px] text-[var(--text-muted)]">
          <span>Search Grow a Garden 2 database</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
