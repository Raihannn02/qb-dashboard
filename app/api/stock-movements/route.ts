import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase.from('stock_movements').select('*, products(name, product_code)', { count: 'exact' });

    if (type) query = query.eq('type', type);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const from = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    let movements = ((data || []) as any[]).map(m => ({
      ...m,
      product_name: m.products?.name,
      product_code: m.products?.product_code,
    }));

    if (search) {
      movements = movements.filter(m =>
        m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.product_code?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({ movements, total: count || 0, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { product_id, type, quantity, notes } = await request.json();
    if (!product_id || !type || !quantity) {
      return NextResponse.json({ error: 'Product ID, type, and quantity required' }, { status: 400 });
    }

    const qty = parseInt(quantity);
    const { data: inv } = await supabase.from('inventory').select('current_stock').eq('product_id', product_id).single();
    const stockBefore = inv?.current_stock || 0;

    let stockAfter = stockBefore;
    if (type === 'Stock In' || type === 'Return') stockAfter += qty;
    else if (type === 'Stock Out') stockAfter = Math.max(0, stockBefore - qty);
    else stockAfter = qty; // Adjustment or Correction

    await supabase.from('inventory').update({ current_stock: stockAfter, updated_at: new Date().toISOString() }).eq('product_id', product_id);

    const smId = generateId();
    await supabase.from('stock_movements').insert({
      id: smId, product_id, type, quantity: qty,
      stock_before: stockBefore, stock_after: stockAfter,
      source: 'Manual Adjustment', notes: notes || '',
    });

    const { data: product } = await supabase.from('products').select('name').eq('id', product_id).single();
    await supabase.from('activity_logs').insert({
      id: generateId(), action: 'STOCK_ADJUSTMENT', entity_type: 'product', entity_id: product_id,
      description: `Stock adjustment (${type}) for "${product?.name}": ${stockBefore} → ${stockAfter}`,
    });

    // Check low stock
    const { data: settingData } = await supabase.from('settings').select('value').eq('key', 'low_stock_threshold').single();
    const threshold = parseInt(settingData?.value || '5');
    if (stockAfter <= threshold) {
      await supabase.from('notifications').insert({
        id: generateId(), type: 'warning', title: 'Low Stock Alert',
        message: `Product "${product?.name}" stock is down to ${stockAfter} units.`,
      });
    }

    return NextResponse.json({ success: true, stock_before: stockBefore, stock_after: stockAfter });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
