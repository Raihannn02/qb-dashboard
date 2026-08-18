import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateMargin } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    let txQuery = supabase.from('transactions').select('total, total_hpp, profit').eq('status', 'Completed');
    if (dateFrom) txQuery = txQuery.gte('created_at', dateFrom);
    if (dateTo) txQuery = txQuery.lte('created_at', dateTo + 'T23:59:59');

    let expQuery = supabase.from('expenses').select('category, amount');
    if (dateFrom) expQuery = expQuery.gte('date', dateFrom);
    if (dateTo) expQuery = expQuery.lte('date', dateTo);

    const [txRes, expRes] = await Promise.all([txQuery, expQuery]);

    const completedTx = txRes.data || [];
    const revenue = completedTx.reduce((s, t) => s + parseFloat(t.total || 0), 0);
    const hpp = completedTx.reduce((s, t) => s + parseFloat(t.total_hpp || 0), 0);
    const grossProfit = completedTx.reduce((s, t) => s + parseFloat(t.profit || 0), 0);
    const grossMargin = calculateMargin(grossProfit, revenue);

    const expData = expRes.data || [];
    const totalExpenses = expData.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    const expCategoryMap: Record<string, number> = {};
    expData.forEach(e => {
      expCategoryMap[e.category] = (expCategoryMap[e.category] || 0) + parseFloat(e.amount || 0);
    });
    const expensesByCategory = Object.entries(expCategoryMap).map(([category, total]) => ({ category, total }));

    const netProfit = grossProfit - totalExpenses;
    const netMargin = calculateMargin(netProfit, revenue);

    return NextResponse.json({
      revenue, hpp, gross_profit: grossProfit, gross_margin: grossMargin,
      total_expenses: totalExpenses, expenses_by_category: expensesByCategory,
      net_profit: netProfit, net_margin: netMargin,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
