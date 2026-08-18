const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mmuukxdaomjtirmegcho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdXVreGRhb21qdGlybWVnY2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDEyNDEsImV4cCI6MjEwMjYxNzI0MX0.2Rnjt1U9UHJee_PPvLOdwGR2Qn77mrZZfRVbge01gUk';

const supabase = createClient(supabaseUrl, supabaseKey);

const productsData = [
  { product_code: 'P001', name: 'Bamboo', category: 'Fruit' },
  { product_code: 'P002', name: 'Mushroom', category: 'Fruit' },
  { product_code: 'P003', name: 'Mega', category: 'Fruit' },
  { product_code: 'P004', name: 'Rainbow', category: 'Fruit' },
  { product_code: 'P005', name: 'Gold', category: 'Fruit' },
  { product_code: 'P006', name: 'Venus Fly Trap', category: 'Fruit' },
  { product_code: 'P007', name: 'Venom Spitter', category: 'Fruit' },
  { product_code: 'P008', name: 'Moon Bloom', category: 'Fruit' },
  { product_code: 'P009', name: 'Sun Bloom', category: 'Fruit' },
  { product_code: 'P010', name: 'Hypno Bloom', category: 'Fruit' },
  { product_code: 'P011', name: "Dragon's Breath", category: 'Fruit' },
  { product_code: 'P012', name: 'Star Fruit', category: 'Fruit' },
  { product_code: 'P013', name: 'Trowel', category: 'Tool' },
  { product_code: 'P014', name: 'Uncommon Sprinkler', category: 'Sprinkler' },
  { product_code: 'P015', name: 'Rare Sprinkler', category: 'Sprinkler' },
  { product_code: 'P016', name: 'Super Sprinkler', category: 'Sprinkler' },
  { product_code: 'P017', name: 'Super Watering Can', category: 'Tool' },
  { product_code: 'P018', name: 'Legendary Sprinkler', category: 'Sprinkler' },
  { product_code: 'P019', name: 'Black Dragon', category: 'Pet' },
  { product_code: 'P020', name: 'Ice Serpent', category: 'Pet' },
  { product_code: 'P021', name: 'Jandel Monkey', category: 'Pet' },
  { product_code: 'P022', name: 'Raccoon', category: 'Pet' },
  { product_code: 'P023', name: 'Common Egg', category: 'Egg' },
];

const accountMap = {
  1: ['gagzip642', 'wsxqq2077', 'fccce31', 'gagtux153', 'nolanpapat', 'odetpitu'],
  2: ['nanangpitu', 'jonsonodet554', 'lancelotsiji', 'belerikpatji', 'pakelarep', 'erds6f', 'gtk776v', 'iuuhhhd4', 'rt55rw22', 'nejibaik'],
  3: ['paaakduitttpaaaa', 'helkrut222', 'gossen443', 'luyyhtd2', 'tyrrrw3'],
  4: ['foufffo', 'fredd2b', 'yuhhhhde4', 'tyvff34', 'mbg55t'],
  5: ['fdrrsss3', 'vfgge4zs', 'xdrre3s', 'vfhh444zs', 'sysukawitsawit'],
  6: ['trfffse3', 'wawwwwww8775', 'scpsijiloro', 'sdce5an', 'cvbftjyy7'],
  7: ['gsdvxer5', 'gvf5t4sz', 'hbcvf54', 'bakulsotokuah', 'laronloroloro'],
  8: ['lemudjahat', 'bakulayampak', 'kuiy9d', '6gsfv', 'sf5vgs'],
  9: ['dgc6a', 'xoh63f', 'velerbambu3k', 'witmlinjoo'],
  10: []
};

async function seed() {
  console.log('Seeding Supabase...');

  // 1. Products & Inventory
  for (const p of productsData) {
    let { data: existing } = await supabase.from('products').select('id').eq('product_code', p.product_code).single();
    let productId;
    if (!existing) {
      const { data: newProd, error } = await supabase.from('products').insert(p).select('id').single();
      if (error) { console.error('Product err:', error.message); continue; }
      productId = newProd.id;
      console.log(`Inserted product: ${p.name}`);
    } else {
      productId = existing.id;
    }

    // Ensure inventory
    const { data: inv } = await supabase.from('inventory').select('id').eq('product_id', productId).single();
    if (!inv) {
      await supabase.from('inventory').insert({ product_id: productId, current_stock: 0 });
      console.log(`Created inventory for: ${p.name}`);
    }
  }

  // 2. RF Devices & Accounts
  for (let num = 1; num <= 10; num++) {
    let { data: rf } = await supabase.from('rf_devices').select('id').eq('device_number', num).single();
    let rfId;
    if (!rf) {
      const { data: newRf, error } = await supabase.from('rf_devices').insert({
        name: `RF${num}`, device_number: num, monthly_cost: 57000, status: 'Active'
      }).select('id').single();
      if (error) { console.error('RF err:', error.message); continue; }
      rfId = newRf.id;
      console.log(`Inserted RF${num}`);
    } else {
      rfId = rf.id;
    }

    const usernames = accountMap[num] || [];
    for (const username of usernames) {
      const { data: acc } = await supabase.from('roblox_accounts').select('id').eq('username', username).single();
      if (!acc) {
        await supabase.from('roblox_accounts').insert({ rf_device_id: rfId, username, status: 'Logged In' });
        console.log(`Inserted account ${username} for RF${num}`);
      }
    }
  }

  console.log('✅ Seeding complete!');
}

seed().catch(console.error);
