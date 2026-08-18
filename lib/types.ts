export type ProductCategory = 'Fruit' | 'Pet' | 'Egg' | 'Gear' | 'Sprinkler' | 'Tool' | 'Variant' | 'Other';
export type ProductStatus = 'Active' | 'Inactive' | 'Discontinued';
export type TransactionStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
export type TransactionPlatform = 'G2G' | 'Itemku' | 'Discord' | 'Direct' | 'Other';
export type StockMovementType = 'Stock In' | 'Stock Out' | 'Adjustment' | 'Return' | 'Correction';
export type RFDeviceStatus = 'Active' | 'Offline' | 'Maintenance';
export type RobloxAccountStatus = 'Logged In' | 'Belum Login' | 'Problem' | 'Maintenance';
export type ExpenseCategory = 'RedFinger' | 'Internet' | 'Electricity' | 'Software' | 'Marketplace Fee' | 'Operational' | 'Other';

export interface Product {
  id: string;
  product_code: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  status: ProductStatus;
  default_price: number;
  cost_price: number;
  unit: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  current_stock?: number;
  total_sold?: number;
  total_revenue?: number;
  total_profit?: number;
}

export interface Inventory {
  id: string;
  product_id: string;
  current_stock: number;
  reserved_stock: number;
  created_at: string;
  updated_at: string;
  // Joined
  product_name?: string;
  product_code?: string;
  category?: string;
  status?: string;
  default_price?: number;
}

export interface Transaction {
  id: string;
  transaction_code: string;
  product_id: string;
  quantity: number;
  unit_price_snapshot: number;
  hpp_snapshot: number;
  total: number;
  total_hpp: number;
  profit: number;
  margin: number;
  platform: TransactionPlatform;
  buyer_username: string;
  status: TransactionStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  product_name?: string;
  product_code?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  source: string;
  reference_id: string;
  notes: string;
  created_at: string;
  // Joined
  product_name?: string;
  product_code?: string;
}

export interface RFDevice {
  id: string;
  name: string;
  device_number: number;
  monthly_cost: number;
  status: RFDeviceStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  account_count?: number;
}

export interface RobloxAccount {
  id: string;
  rf_device_id: string;
  username: string;
  status: RobloxAccountStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  rf_name?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalRevenue: number;
  netProfit: number;
  totalHpp: number;
  stockValue: number;
  totalTransactions: number;
  completedTransactions: number;
  grossProfit: number;
  totalExpenses: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  profit: number;
}
