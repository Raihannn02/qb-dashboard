import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: product, error } = await supabase
      .from('products').select('*, inventory(current_stock)').eq('id', id).single();
    if (error || !product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: txData } = await supabase.from('transactions').select('quantity, total, profit').eq('product_id', id).eq('status', 'Completed');
    const total_sold = (txData || []).reduce((s, t) => s + t.quantity, 0);
    const total_revenue = (txData || []).reduce((s, t) => s + parseFloat(t.total), 0);
    const total_profit = (txData || []).reduce((s, t) => s + parseFloat(t.profit), 0);

    const { data: recentTransactions } = await supabase.from('transactions').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(10);
    const { data: stockHistory } = await supabase.from('stock_movements').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(20);

    return NextResponse.json({
      product: { ...product, current_stock: product.inventory?.[0]?.current_stock ?? 0, total_sold, total_revenue, total_profit },
      recentTransactions: recentTransactions || [],
      stockHistory: stockHistory || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, category, subcategory, default_price, cost_price, unit, status, notes } = await request.json();
    const { error } = await supabase.from('products').update({
      name, category, subcategory: subcategory || '', default_price: default_price || 0,
      cost_price: cost_price || 0, unit: unit || 'pcs', status, notes: notes || '',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
    await supabase.from('activity_logs').insert({ id: generateId(), action: 'EDIT_PRODUCT', entity_type: 'product', entity_id: id, description: `Edited product "${name}"` });
    const { data: product } = await supabase.from('products').select('*, inventory(current_stock)').eq('id', id).single();
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { count: txCount } = await supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('product_id', id);
    const { count: smCount } = await supabase.from('stock_movements').select('id', { count: 'exact', head: true }).eq('product_id', id);

    const { data: product } = await supabase.from('products').select('name').eq('id', id).single();

    if ((txCount || 0) > 0 || (smCount || 0) > 0) {
      await supabase.from('products').update({ status: 'Inactive', updated_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('activity_logs').insert({ id: generateId(), action: 'DEACTIVATE_PRODUCT', entity_type: 'product', entity_id: id, description: `Deactivated product "${product?.name}"` });
      return NextResponse.json({ deactivated: true });
    }

    await supabase.from('inventory').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
    await supabase.from('activity_logs').insert({ id: generateId(), action: 'DELETE_PRODUCT', entity_type: 'product', entity_id: id, description: `Deleted product "${product?.name}"` });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
