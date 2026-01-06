
export enum RoleType {
  ROOT = 'ROOT',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

export type PermissionCode = 
  | 'DASHBOARD_VIEW'
  | 'POS_ACCESS'
  | 'CATALOG_VIEW'
  | 'CATALOG_MANAGE'
  | 'EXPENSES_VIEW'
  | 'EXPENSES_MANAGE'
  | 'TRANSFERS_VIEW'
  | 'TRANSFERS_MANAGE'
  | 'TICKETS_VIEW'
  | 'TICKETS_MANAGE'
  | 'STAFF_MANAGE'
  | 'AUDIT_VIEW'
  | 'BACKUP_RESET';

export interface RoleDefinition {
  id: string;
  name: string;
  permissions: PermissionCode[];
}

export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE'
}

export enum ItemCategory {
  PHONE = 'PHONE',
  ACCESSORY = 'ACCESSORY',
  IT_SERVICE = 'IT_SERVICE',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  SIM = 'SIM',
  RECHARGE = 'RECHARGE',
  CODE = 'CODE'
}

export interface Staff {
  id: string;
  full_name: string;
  pin_hash?: string;
  role: string; // Dynamic roles
  permissions: PermissionCode[];
  assignedItemIds?: string[]; // IDs of products/services they are allowed to manage
  ui_language: 'fr' | 'en';
  ui_theme: 'light' | 'blue-dark';
  is_root: boolean;
  is_active?: boolean;
}

export interface CatalogItem {
  id: string;
  sku?: string;
  item_type: ItemType;
  name: string;
  category: ItemCategory;
  price_amount: number;
  stock_qty: number;
  track_stock: boolean;
}

export interface CartItem extends CatalogItem {
  cartId: string;
  qty: number;
}

export interface Sale {
  id: string;
  sale_no: string;
  total_amount: number;
  status: 'PAID' | 'DRAFT' | 'VOID';
  items: CartItem[];
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  user?: string;
}

export interface Ticket {
  id: string;
  ticket_no: string;
  title: string;
  type: 'IT' | 'CUSTOMER_SERVICE';
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_to?: string;
  created_at: string;
  customer_name?: string;
}

export interface Transfer {
  id: string;
  provider: 'TMONEY' | 'FLOOZ';
  amount: number;
  fee_amount: number;
  commission_amount: number;
  type: 'IN' | 'OUT'; // IN = Depot, OUT = Retrait
  status: 'DONE' | 'CANCELED';
  customer_phone: string;
  reference?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_name: string;
  entity: string;
  details: string;
  created_at: string;
}
