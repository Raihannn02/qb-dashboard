import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select('*, inventory(current_stock)', { count: 'exact' });

    if (search) query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    query = query.order('product_code', { ascending: true }).range(from, to);

    const { data: products, error, count } = await query;
    if (error) throw error;

    // Get transaction aggregates for each product
    const productIds = (products || []).map(p => p.id);
    let txAggregates: Record<string, any> = {};
    if (productIds.length > 0) {
      const { data: txData } = await supabase
        .from('transactions')
        .select('product_id, quantity, total, profit')
        .in('product_id', productIds)
        .eq('status', 'Completed');

      (txData || []).forEach(tx => {
        if (!txAggregates[tx.product_id]) txAggregates[tx.product_id] = { total_sold: 0, total_revenue: 0, total_profit: 0 };
        txAggregates[tx.product_id].total_sold += tx.quantity;
        txAggregates[tx.product_id].total_revenue += parseFloat(tx.total);
        txAggregates[tx.product_id].total_profit += parseFloat(tx.profit);
      });
    }

    const enriched = (products || []).map(p => ({
      ...p,
      current_stock: p.inventory?.[0]?.current_stock ?? 0,
      ...( txAggregates[p.id] || { total_sold: 0, total_revenue: 0, total_profit: 0 }),
    }));

    return NextResponse.json({ products: enriched, total: count || 0, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, subcategory, default_price, cost_price, unit, status, notes, initial_stock } = body;
    if (!name || !category) return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });

    // Generate product code
    const { data: lastProd } = await supabase
      .from('products').select('product_code').order('product_code', { ascending: false }).limit(1);
    let nextNum = 1;
    if (lastProd && lastProd.length > 0) {
      const last = parseInt(lastProd[0].product_code.replace('P', ''));
      if (!isNaN(last)) nextNum = last + 1;
    }
    const product_code = `P${String(nextNum).padStart(3, '0')}`;
    const id = generateId();

    const { error: pErr } = await supabase.from('products').insert({
      id, product_code, name, category,
      subcategory: subcategory || '', status: status || 'Active',
      default_price: default_price || 0, cost_price: cost_price || 0,
      unit: unit || 'pcs', notes: notes || '',
    });
    if (pErr) throw pErr;

    const { error: iErr } = await supabase.from('inventory').insert({
      id: generateId(), product_id: id, current_stock: initial_stock || 0,
    });
    if (iErr) throw iErr;

    if (initial_stock && initial_stock > 0) {
      await supabase.from('stock_movements').insert({
        id: generateId(), product_id: id, type: 'Stock In',
        quantity: initial_stock, stock_before: 0, stock_after: initial_stock,
        source: 'Initial Stock', notes: 'Initial stock when product created',
      });
    }

    await supabase.from('activity_logs').insert({ id: generateId(), action: 'ADD_PRODUCT', entity_type: 'product', entity_id: id, description: `Added product "${name}" (${product_code})` });
    await supabase.from('notifications').insert({ id: generateId(), type: 'success', title: 'New Product Added', message: `Product "${name}" has been added successfully.` });

    const { data: product } = await supabase.from('products').select('*, inventory(current_stock)').eq('id', id).single();
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
