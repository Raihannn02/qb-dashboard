import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';
import { calculateMargin } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const platform = searchParams.get('platform') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase.from('transactions').select('*, products(name, product_code)', { count: 'exact' });

    if (search) query = query.or(`transaction_code.ilike.%${search}%,buyer_username.ilike.%${search}%`);
    if (status) query = query.eq('status', status);
    if (platform) query = query.eq('platform', platform);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const from = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const transactions = (data || []).map(t => ({
      ...t,
      product_name: (t.products as any)?.name,
      product_code: (t.products as any)?.product_code,
    }));

    // Also filter by product name if search
    const filtered = search
      ? transactions.filter(t => t.transaction_code?.toLowerCase().includes(search.toLowerCase()) || t.buyer_username?.toLowerCase().includes(search.toLowerCase()) || t.product_name?.toLowerCase().includes(search.toLowerCase()))
      : transactions;

    return NextResponse.json({ transactions: filtered, total: count || 0, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, quantity, unit_price, hpp, platform, buyer_username, status, notes } = body;
    if (!product_id || !quantity) return NextResponse.json({ error: 'Product and quantity required' }, { status: 400 });

    const { data: product } = await supabase.from('products').select('*').eq('id', product_id).single();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const unitPrice = parseFloat(unit_price) || product.default_price || 0;
    const hppPrice = parseFloat(hpp) || product.cost_price || 0;
    const qty = parseInt(quantity);
    const total = qty * unitPrice;
    const totalHpp = qty * hppPrice;
    const profit = total - totalHpp;
    const margin = calculateMargin(profit, total);

    // Generate transaction code
    const { data: lastTx } = await supabase.from('transactions').select('transaction_code').order('created_at', { ascending: false }).limit(1);
    let nextNum = 1;
    if (lastTx && lastTx.length > 0) {
      const match = lastTx[0].transaction_code.match(/TRX-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const transaction_code = `TRX-${String(nextNum).padStart(4, '0')}`;
    const id = generateId();

    const { error } = await supabase.from('transactions').insert({
      id, transaction_code, product_id, quantity: qty,
      unit_price_snapshot: unitPrice, hpp_snapshot: hppPrice,
      total, total_hpp: totalHpp, profit, margin,
      platform: platform || 'Direct', buyer_username: buyer_username || '',
      status: status || 'Pending', notes: notes || '',
    });
    if (error) throw error;

    if (status === 'Completed') {
      const { data: inv } = await supabase.from('inventory').select('current_stock').eq('product_id', product_id).single();
      const stockBefore = inv?.current_stock || 0;
      const stockAfter = Math.max(0, stockBefore - qty);
      await supabase.from('inventory').update({ current_stock: stockAfter, updated_at: new Date().toISOString() }).eq('product_id', product_id);
      await supabase.from('stock_movements').insert({ id: generateId(), product_id, type: 'Stock Out', quantity: qty, stock_before: stockBefore, stock_after: stockAfter, source: 'Transaction', reference_id: id, notes: `Sale: ${transaction_code}` });
    }

    await supabase.from('activity_logs').insert({ id: generateId(), action: 'ADD_TRANSACTION', entity_type: 'transaction', entity_id: id, description: `Added transaction ${transaction_code} for "${product.name}" x${qty}` });
    await supabase.from('notifications').insert({ id: generateId(), type: 'success', title: 'Transaction Added', message: `${transaction_code} created for ${product.name}` });

    const { data: transaction } = await supabase.from('transactions').select('*, products(name, product_code)').eq('id', id).single();
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
