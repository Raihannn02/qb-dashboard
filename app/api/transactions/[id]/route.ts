import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';
import { calculateMargin } from '@/lib/utils';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabase.from('transactions').select('*').eq('id', id).single();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const newStatus = body.status || existing.status;
    const wasCompleted = existing.status === 'Completed';
    const nowCompleted = newStatus === 'Completed';
    const nowCancelled = newStatus === 'Cancelled';
    const qty = body.quantity || existing.quantity;
    const unitPrice = body.unit_price !== undefined ? parseFloat(body.unit_price) : parseFloat(existing.unit_price_snapshot);
    const hppPrice = body.hpp !== undefined ? parseFloat(body.hpp) : parseFloat(existing.hpp_snapshot);
    const total = qty * unitPrice;
    const totalHpp = qty * hppPrice;
    const profit = total - totalHpp;
    const margin = calculateMargin(profit, total);

    await supabase.from('transactions').update({
      quantity: qty, unit_price_snapshot: unitPrice, hpp_snapshot: hppPrice,
      total, total_hpp: totalHpp, profit, margin,
      platform: body.platform || existing.platform,
      buyer_username: body.buyer_username ?? existing.buyer_username,
      status: newStatus, notes: body.notes ?? existing.notes,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    const { data: inv } = await supabase.from('inventory').select('current_stock').eq('product_id', existing.product_id).single();
    const stockNow = inv?.current_stock || 0;

    if (!wasCompleted && nowCompleted) {
      const stockAfter = Math.max(0, stockNow - qty);
      await supabase.from('inventory').update({ current_stock: stockAfter, updated_at: new Date().toISOString() }).eq('product_id', existing.product_id);
      await supabase.from('stock_movements').insert({ id: generateId(), product_id: existing.product_id, type: 'Stock Out', quantity: qty, stock_before: stockNow, stock_after: stockAfter, source: 'Transaction', reference_id: id, notes: `Sale: ${existing.transaction_code}` });
      await supabase.from('notifications').insert({ id: generateId(), type: 'success', title: 'Transaction Completed', message: `${existing.transaction_code} has been completed.` });
    }

    if (wasCompleted && nowCancelled) {
      const stockAfter = stockNow + existing.quantity;
      await supabase.from('inventory').update({ current_stock: stockAfter, updated_at: new Date().toISOString() }).eq('product_id', existing.product_id);
      await supabase.from('stock_movements').insert({ id: generateId(), product_id: existing.product_id, type: 'Return', quantity: existing.quantity, stock_before: stockNow, stock_after: stockAfter, source: 'Transaction Cancelled', reference_id: id, notes: `Return: ${existing.transaction_code} cancelled` });
    }

    await supabase.from('activity_logs').insert({ id: generateId(), action: 'EDIT_TRANSACTION', entity_type: 'transaction', entity_id: id, description: `Updated transaction ${existing.transaction_code} → ${newStatus}` });

    const { data: updated } = await supabase.from('transactions').select('*, products(name, product_code)').eq('id', id).single();
    return NextResponse.json({ transaction: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (tx.status === 'Completed') {
      const { data: inv } = await supabase.from('inventory').select('current_stock').eq('product_id', tx.product_id).single();
      const stockBefore = inv?.current_stock || 0;
      const stockAfter = stockBefore + tx.quantity;
      await supabase.from('inventory').update({ current_stock: stockAfter, updated_at: new Date().toISOString() }).eq('product_id', tx.product_id);
      await supabase.from('stock_movements').insert({ id: generateId(), product_id: tx.product_id, type: 'Return', quantity: tx.quantity, stock_before: stockBefore, stock_after: stockAfter, source: 'Transaction Deleted', reference_id: id, notes: `Deleted: ${tx.transaction_code}` });
    }

    await supabase.from('transactions').delete().eq('id', id);
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
