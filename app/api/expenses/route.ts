import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase.from('expenses').select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const from = (page - 1) * limit;
    query = query.order('date', { ascending: false }).range(from, from + limit - 1);

    const { data: expenses, error, count } = await query;
    if (error) throw error;

    // Summary calculation
    let sumQuery = supabase.from('expenses').select('amount');
    if (category) sumQuery = sumQuery.eq('category', category);
    if (dateFrom) sumQuery = sumQuery.gte('date', dateFrom);
    if (dateTo) sumQuery = sumQuery.lte('date', dateTo);

    const { data: sumData } = await sumQuery;
    const summary = (sumData || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    return NextResponse.json({ expenses: expenses || [], total: count || 0, summary, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, category, description, amount, notes } = await request.json();
    if (!description || amount === undefined) {
      return NextResponse.json({ error: 'Description and amount required' }, { status: 400 });
    }

    const id = generateId();
    const { error } = await supabase.from('expenses').insert({
      id, date: date || new Date().toISOString().split('T')[0],
      category: category || 'Other', description, amount: parseFloat(amount), notes: notes || '',
    });
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      id: generateId(), action: 'ADD_EXPENSE', entity_type: 'expense', entity_id: id,
      description: `Added expense "${description}" (${amount})`,
    });

    const { data: expense } = await supabase.from('expenses').select('*').eq('id', id).single();
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, date, category, description, amount, notes } = await request.json();
    const { error } = await supabase.from('expenses').update({
      date, category, description, amount: parseFloat(amount), notes,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;

    const { data: expense } = await supabase.from('expenses').select('*').eq('id', id).single();
    return NextResponse.json({ expense });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await supabase.from('expenses').delete().eq('id', id);
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
