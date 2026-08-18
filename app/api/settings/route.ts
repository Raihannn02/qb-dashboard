import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: rows, error } = await supabase.from('settings').select('key, value');
    if (error) throw error;

    const settings: Record<string, string> = {};
    (rows || []).forEach(r => { settings[r.key] = r.value; });

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await supabase.from('settings').upsert({
        key, value: String(value), updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    }

    await supabase.from('activity_logs').insert({
      id: generateId(), action: 'UPDATE_SETTINGS', entity_type: 'settings', entity_id: '',
      description: 'Updated system settings',
    });

    const { data: rows } = await supabase.from('settings').select('key, value');
    const settings: Record<string, string> = {};
    (rows || []).forEach(r => { settings[r.key] = r.value; });

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
