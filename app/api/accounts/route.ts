import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rfId = searchParams.get('rf_id') || '';
    const search = searchParams.get('search') || '';

    let query = supabase.from('roblox_accounts').select('*, rf_devices(name, device_number)');
    if (rfId) query = query.eq('rf_device_id', rfId);
    if (search) query = query.ilike('username', `%${search}%`);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    const accounts = ((data || []) as any[]).map(a => ({
      ...a,
      rf_name: a.rf_devices?.name,
      device_number: a.rf_devices?.device_number,
    }));

    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { rf_device_id, username, status, notes } = await request.json();
    if (!rf_device_id || !username) {
      return NextResponse.json({ error: 'RF device and username required' }, { status: 400 });
    }

    const id = generateId();
    const { error } = await supabase.from('roblox_accounts').insert({
      id, rf_device_id, username, status: status || 'Logged In', notes: notes || '',
    });
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      id: generateId(), action: 'ADD_ROBLOX_ACCOUNT', entity_type: 'roblox_account', entity_id: id,
      description: `Added Roblox account "${username}"`,
    });

    const { data: account } = await supabase.from('roblox_accounts').select('*, rf_devices(name)').eq('id', id).single();
    return NextResponse.json({ account }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, notes, rf_device_id } = await request.json();
    const { error } = await supabase.from('roblox_accounts').update({
      status, notes, rf_device_id, updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;

    const { data: account } = await supabase.from('roblox_accounts').select('*, rf_devices(name)').eq('id', id).single();
    return NextResponse.json({ account });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { data: acc } = await supabase.from('roblox_accounts').select('username').eq('id', id).single();
    await supabase.from('roblox_accounts').delete().eq('id', id);
    await supabase.from('activity_logs').insert({
      id: generateId(), action: 'DELETE_ROBLOX_ACCOUNT', entity_type: 'roblox_account', entity_id: id,
      description: `Deleted account "${acc?.username}"`,
    });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
