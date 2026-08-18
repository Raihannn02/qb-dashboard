-- ========================================
-- QB DASHBOARD — Supabase SQL Migration
-- Jalankan SQL ini di Supabase SQL Editor
-- ========================================

-- TABLES
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  subcategory TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  default_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL UNIQUE REFERENCES products(id),
  current_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  transaction_code TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price_snapshot NUMERIC(15,2) NOT NULL DEFAULT 0,
  hpp_snapshot NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_hpp NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  margin NUMERIC(5,2) NOT NULL DEFAULT 0,
  platform TEXT NOT NULL DEFAULT 'Direct',
  buyer_username TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  source TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rf_devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  device_number INTEGER UNIQUE NOT NULL,
  monthly_cost NUMERIC(15,2) NOT NULL DEFAULT 57000,
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roblox_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rf_device_id TEXT NOT NULL REFERENCES rf_devices(id),
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Logged In',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DISABLE RLS (single-user dashboard)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE rf_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE roblox_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_transactions_product ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_roblox_accounts_rf ON roblox_accounts(rf_device_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- DEFAULT SETTINGS
INSERT INTO settings (key, value) VALUES
  ('store_name', 'QB DASHBOARD'),
  ('currency', 'IDR'),
  ('low_stock_threshold', '5'),
  ('theme', 'dark')
ON CONFLICT (key) DO NOTHING;

-- SEED PRODUCTS (23 items)
WITH inserted_products AS (
  INSERT INTO products (product_code, name, category) VALUES
    ('P001','Bamboo','Fruit'),('P002','Mushroom','Fruit'),('P003','Mega','Fruit'),
    ('P004','Rainbow','Fruit'),('P005','Gold','Fruit'),('P006','Venus Fly Trap','Fruit'),
    ('P007','Venom Spitter','Fruit'),('P008','Moon Bloom','Fruit'),('P009','Sun Bloom','Fruit'),
    ('P010','Hypno Bloom','Fruit'),('P011','Dragon''s Breath','Fruit'),('P012','Star Fruit','Fruit'),
    ('P013','Trowel','Tool'),('P014','Uncommon Sprinkler','Sprinkler'),
    ('P015','Rare Sprinkler','Sprinkler'),('P016','Super Sprinkler','Sprinkler'),
    ('P017','Super Watering Can','Tool'),('P018','Legendary Sprinkler','Sprinkler'),
    ('P019','Black Dragon','Pet'),('P020','Ice Serpent','Pet'),
    ('P021','Jandel Monkey','Pet'),('P022','Raccoon','Pet'),('P023','Common Egg','Egg')
  ON CONFLICT (product_code) DO NOTHING
  RETURNING id
)
INSERT INTO inventory (product_id, current_stock)
SELECT id, 0 FROM inserted_products
ON CONFLICT (product_id) DO NOTHING;

-- SEED RF DEVICES
INSERT INTO rf_devices (name, device_number, monthly_cost, status) VALUES
  ('RF1',1,57000,'Active'),('RF2',2,57000,'Active'),('RF3',3,57000,'Active'),
  ('RF4',4,57000,'Active'),('RF5',5,57000,'Active'),('RF6',6,57000,'Active'),
  ('RF7',7,57000,'Active'),('RF8',8,57000,'Active'),('RF9',9,57000,'Active'),
  ('RF10',10,57000,'Active')
ON CONFLICT (device_number) DO NOTHING;

-- SEED ROBLOX ACCOUNTS
INSERT INTO roblox_accounts (rf_device_id, username, status)
SELECT r.id, acc.username, 'Logged In'
FROM rf_devices r
JOIN (VALUES
  (1,'gagzip642'),(1,'wsxqq2077'),(1,'fccce31'),(1,'gagtux153'),(1,'nolanpapat'),(1,'odetpitu'),
  (2,'nanangpitu'),(2,'jonsonodet554'),(2,'lancelotsiji'),(2,'belerikpatji'),(2,'pakelarep'),
  (2,'erds6f'),(2,'gtk776v'),(2,'iuuhhhd4'),(2,'rt55rw22'),(2,'nejibaik'),
  (3,'paaakduitttpaaaa'),(3,'helkrut222'),(3,'gossen443'),(3,'luyyhtd2'),(3,'tyrrrw3'),
  (4,'foufffo'),(4,'fredd2b'),(4,'yuhhhhde4'),(4,'tyvff34'),(4,'mbg55t'),
  (5,'fdrrsss3'),(5,'vfgge4zs'),(5,'xdrre3s'),(5,'vfhh444zs'),(5,'sysukawitsawit'),
  (6,'trfffse3'),(6,'wawwwwww8775'),(6,'scpsijiloro'),(6,'sdce5an'),(6,'cvbftjyy7'),
  (7,'gsdvxer5'),(7,'gvf5t4sz'),(7,'hbcvf54'),(7,'bakulsotokuah'),(7,'laronloroloro'),
  (8,'lemudjahat'),(8,'bakulayampak'),(8,'kuiy9d'),(8,'6gsfv'),(8,'sf5vgs'),
  (9,'dgc6a'),(9,'xoh63f'),(9,'velerbambu3k'),(9,'witmlinjoo')
) AS acc(device_num, username) ON r.device_number = acc.device_num;
