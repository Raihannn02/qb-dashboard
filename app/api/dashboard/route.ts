import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDateRange } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    let start = dateFrom;
    let end = dateTo;
    if (!start && !end && filter !== 'all') {
      const range = getDateRange(filter);
      start = range.start; end = range.end;
    }

    // Fetch all needed data in parallel
    const [prodRes, invRes, txQuery, expQuery] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
      supabase.from('inventory').select('current_stock, products(default_price)'),
      (() => {
        let q = supabase.from('transactions').select('product_id, total, profit, total_hpp, quantity, status, created_at');
        if (start) q = q.gte('created_at', start);
        if (end) q = q.lte('created_at', end + 'T23:59:59');
        return q;
      })(),
      (() => {
        let q = supabase.from('expenses').select('amount, date');
        if (start) q = q.gte('date', start);
        if (end) q = q.lte('date', end);
        return q;
      })(),
    ]);

    const allTx = (txQuery.data || []) as any[];
    const completedTx = allTx.filter(t => t.status === 'Completed');
    const totalRevenue = completedTx.reduce((s, t) => s + parseFloat(t.total || 0), 0);
    const totalHpp = completedTx.reduce((s, t) => s + parseFloat(t.total_hpp || 0), 0);
    const grossProfit = completedTx.reduce((s, t) => s + parseFloat(t.profit || 0), 0);
    const totalExpenses = (expQuery.data || []).reduce((s, e: any) => s + parseFloat(e.amount || 0), 0);
    const netProfit = grossProfit - totalExpenses;
    const invData = (invRes.data || []) as any[];
    const totalStock = invData.reduce((s, i) => s + (i.current_stock || 0), 0);
    const stockValue = invData.reduce((s, i) => s + (i.current_stock || 0) * (i.products?.default_price || 0), 0);

    // Chart data — group by date
    const chartMap: Record<string, { revenue: number; profit: number }> = {};
    completedTx.forEach(t => {
      const date = t.created_at?.split('T')[0];
      if (!date) return;
      if (!chartMap[date]) chartMap[date] = { revenue: 0, profit: 0 };
      chartMap[date].revenue += parseFloat(t.total || 0);
      chartMap[date].profit += parseFloat(t.profit || 0);
    });
    const chartData = Object.entries(chartMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));

    // Top products
    const { data: prodList } = await supabase.from('products').select('id, name, category, product_code');
    const topMap: Record<string, any> = {};
    completedTx.forEach(t => {
      if (!topMap[t.product_id]) topMap[t.product_id] = { total_sold: 0, total_revenue: 0, total_profit: 0 };
      topMap[t.product_id].total_sold += t.quantity || 0;
      topMap[t.product_id].total_revenue += parseFloat(t.total || 0);
      topMap[t.product_id].total_profit += parseFloat(t.profit || 0);
    });
    const topProducts = ((prodList || []) as any[]).map(p => ({ ...p, ...(topMap[p.id] || { total_sold: 0, total_revenue: 0, total_profit: 0 }) }))
      .sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10);

    // Low stock
    const { data: settingData } = await supabase.from('settings').select('value').eq('key', 'low_stock_threshold').single();
    const threshold = parseInt(settingData?.value || '5');
    const { data: lowStockInv } = await supabase.from('inventory').select('current_stock, products(name, product_code)').lte('current_stock', threshold);
    const lowStock = ((lowStockInv || []) as any[]).filter(i => i.products).map(i => ({
      name: i.products.name,
      product_code: i.products.product_code,
      current_stock: i.current_stock,
    })).sort((a, b) => a.current_stock - b.current_stock);

    // Recent transactions
    const { data: recentTx } = await supabase.from('transactions').select('*, products(name)').order('created_at', { ascending: false }).limit(8);
    const recentTransactions = ((recentTx || []) as any[]).map(t => ({ ...t, product_name: t.products?.name }));

    // RF cost
    const { data: rfData } = await supabase.from('rf_devices').select('monthly_cost').eq('status', 'Active');
    const rfCost = ((rfData || []) as any[]).reduce((s, r) => s + parseFloat(r.monthly_cost || 0), 0);

    return NextResponse.json({
      stats: { total_products: prodRes.count || 0, total_stock: totalStock, stock_value: stockValue, total_revenue: totalRevenue, gross_profit: grossProfit, total_hpp: totalHpp, total_expenses: totalExpenses, net_profit: netProfit, total_transactions: allTx.length, completed_transactions: completedTx.length },
      chartData, topProducts, lowStock, recentTransactions, rfCost,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
