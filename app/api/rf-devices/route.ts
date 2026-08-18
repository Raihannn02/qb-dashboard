import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: rfDevices, error } = await supabase.from('rf_devices').select('*').order('device_number', { ascending: true });
    if (error) throw error;

    const { data: accounts } = await supabase.from('roblox_accounts').select('rf_device_id');
    const accCounts: Record<string, number> = {};
    (accounts || []).forEach(a => {
      accCounts[a.rf_device_id] = (accCounts[a.rf_device_id] || 0) + 1;
    });

    const enriched = (rfDevices || []).map(rf => ({
      ...rf,
      account_count: accCounts[rf.id] || 0,
    }));

    const totalCost = enriched.filter(rf => rf.status === 'Active').reduce((s, rf) => s + parseFloat(rf.monthly_cost || 0), 0);

    return NextResponse.json({ rfDevices: enriched, totalCost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, monthly_cost, status, notes } = await request.json();

    const { data: lastRf } = await supabase.from('rf_devices').select('device_number').order('device_number', { ascending: false }).limit(1);
    const nextNum = (lastRf?.[0]?.device_number || 0) + 1;
    const deviceName = name || `RF${nextNum}`;
    const id = generateId();

    const { error } = await supabase.from('rf_devices').insert({
      id, name: deviceName, device_number: nextNum,
      monthly_cost: monthly_cost || 57000, status: status || 'Active', notes: notes || '',
    });
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      id: generateId(), action: 'ADD_RF_DEVICE', entity_type: 'rf_device', entity_id: id,
      description: `Added RF device "${deviceName}"`,
    });

    const { data: rf } = await supabase.from('rf_devices').select('*').eq('id', id).single();
    return NextResponse.json({ rf }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, monthly_cost, status, notes } = await request.json();
    const { error } = await supabase.from('rf_devices').update({
      monthly_cost: monthly_cost !== undefined ? parseFloat(monthly_cost) : undefined,
      status, notes, updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;

    const { data: rf } = await supabase.from('rf_devices').select('*').eq('id', id).single();
    return NextResponse.json({ rf });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { count } = await supabase.from('roblox_accounts').select('id', { count: 'exact', head: true }).eq('rf_device_id', id);
    if ((count || 0) > 0) {
      await supabase.from('roblox_accounts').update({ rf_device_id: null }).eq('rf_device_id', id);
    }

    const { data: rf } = await supabase.from('rf_devices').select('name').eq('id', id).single();
    const { error } = await supabase.from('rf_devices').delete().eq('id', id);
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      id: generateId(), action: 'DELETE_RF_DEVICE', entity_type: 'rf_device', entity_id: id,
      description: `Deleted RF device "${rf?.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
