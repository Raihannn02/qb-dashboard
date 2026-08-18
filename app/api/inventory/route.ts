import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const stock_status = searchParams.get('stock_status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data: settingData } = await supabase.from('settings').select('value').eq('key', 'low_stock_threshold').single();
    const threshold = parseInt(settingData?.value || '5');

    let query = supabase.from('inventory').select('*, products(id, product_code, name, category, status, default_price, cost_price)', { count: 'exact' });

    if (category) query = query.eq('products.category', category);
    if (stock_status === 'Out of Stock') query = query.eq('current_stock', 0);
    else if (stock_status === 'Low Stock') query = query.gt('current_stock', 0).lte('current_stock', threshold);
    else if (stock_status === 'In Stock') query = query.gt('current_stock', threshold);

    const from = (page - 1) * limit;
    const { data, error, count } = await query.order('current_stock', { ascending: true }).range(from, from + limit - 1);
    if (error) throw error;

    let inventory = (data || [])
      .filter(i => i.products)
      .map(i => {
        const p = i.products as any;
        const stock_value = i.current_stock * (p.default_price || 0);
        const stock_status_val = i.current_stock === 0 ? 'Out of Stock' : i.current_stock <= threshold ? 'Low Stock' : 'In Stock';
        return {
          id: p.id, product_code: p.product_code, name: p.name, category: p.category,
          status: p.status, default_price: p.default_price, cost_price: p.cost_price,
          current_stock: i.current_stock, stock_value, stock_status: stock_status_val,
          updated_at: i.updated_at,
        };
      });

    if (search) inventory = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.product_code.toLowerCase().includes(search.toLowerCase()));

    return NextResponse.json({ inventory, total: count || 0, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
