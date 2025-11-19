/**
 * Common NetSuite field types
 */
export type NetSuiteDate = string; // ISO 8601 format
export type NetSuiteDateTime = string; // ISO 8601 format
export type NetSuiteId = string;

/**
 * Sales Report Data
 */
export interface SalesRecord {
  trandate: NetSuiteDate;
  tranid: string;
  entity: NetSuiteId;
  entity_name: string;
  amount: number;
  status: string;
}

export interface SalesByPeriod {
  period: string; // YYYY-MM
  total_sales: number;
  transaction_count: number;
  unique_customers: number;
}

/**
 * Inventory Report Data
 */
export interface InventoryRecord {
  item_id: NetSuiteId;
  item_name: string;
  display_name: string;
  quantity_available: number;
  quantity_on_hand: number;
  quantity_committed: number;
  reorder_point: number;
  location: string;
}

/**
 * Customer Performance Data
 */
export interface CustomerPerformance {
  customer_id: NetSuiteId;
  customer_name: string;
  total_sales: number;
  transaction_count: number;
  average_order_value: number;
  last_order_date: NetSuiteDate;
  status: string;
}

/**
 * Date range for queries
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}
