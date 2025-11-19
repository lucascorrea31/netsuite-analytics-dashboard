import { NetSuiteClient } from '../client';
import type {
  SalesByPeriod,
  InventoryRecord,
  CustomerPerformance,
  DateRange,
} from '../types';

/**
 * Pre-built SuiteQL queries for common reports
 */

/**
 * Get sales aggregated by month
 */
export async function getSalesByMonth(
  client: NetSuiteClient,
  dateRange: DateRange
): Promise<SalesByPeriod[]> {
  const query = `
    SELECT 
      TO_CHAR(t.trandate, 'YYYY-MM') as period,
      SUM(t.amount) as total_sales,
      COUNT(*) as transaction_count,
      COUNT(DISTINCT t.entity) as unique_customers
    FROM 
      transaction t
    WHERE 
      t.trandate BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      AND t.type = 'SalesOrd'
      AND t.status NOT IN ('Cancelled', 'Closed')
    GROUP BY 
      TO_CHAR(t.trandate, 'YYYY-MM')
    ORDER BY 
      period DESC
  `;

  const response = await client.executeSuiteQL<SalesByPeriod>(query);
  return response.items;
}

/**
 * Get current inventory levels
 */
export async function getCurrentInventory(
  client: NetSuiteClient,
  locationId?: string
): Promise<InventoryRecord[]> {
  const locationFilter = locationId
    ? `AND il.location = ${locationId}`
    : '';

  const query = `
    SELECT 
      i.id as item_id,
      i.itemid as item_name,
      i.displayname as display_name,
      il.quantityavailable as quantity_available,
      il.quantityonhand as quantity_on_hand,
      il.quantitycommitted as quantity_committed,
      i.reorderpoint as reorder_point,
      l.name as location
    FROM 
      item i
    INNER JOIN 
      inventoryitemlocation il ON i.id = il.item
    INNER JOIN 
      location l ON il.location = l.id
    WHERE 
      i.isinactive = 'F'
      ${locationFilter}
    ORDER BY 
      i.itemid
  `;

  const response = await client.executeSuiteQL<InventoryRecord>(query, {
    limit: 1000,
  });
  return response.items;
}

/**
 * Get customer performance metrics
 */
export async function getCustomerPerformance(
  client: NetSuiteClient,
  dateRange: DateRange,
  topN: number = 50
): Promise<CustomerPerformance[]> {
  const query = `
    SELECT 
      c.id as customer_id,
      c.companyname as customer_name,
      SUM(t.amount) as total_sales,
      COUNT(*) as transaction_count,
      AVG(t.amount) as average_order_value,
      MAX(t.trandate) as last_order_date,
      c.status as status
    FROM 
      transaction t
    INNER JOIN 
      customer c ON t.entity = c.id
    WHERE 
      t.trandate BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      AND t.type = 'SalesOrd'
      AND t.status NOT IN ('Cancelled')
    GROUP BY 
      c.id, c.companyname, c.status
    ORDER BY 
      total_sales DESC
    FETCH FIRST ${topN} ROWS ONLY
  `;

  const response = await client.executeSuiteQL<CustomerPerformance>(query);
  return response.items;
}

/**
 * Get sales trend (daily aggregation for charts)
 */
export async function getSalesTrend(
  client: NetSuiteClient,
  dateRange: DateRange
): Promise<Array<{ date: string; sales: number; orders: number }>> {
  const query = `
    SELECT 
      TO_CHAR(t.trandate, 'YYYY-MM-DD') as date,
      SUM(t.amount) as sales,
      COUNT(*) as orders
    FROM 
      transaction t
    WHERE 
      t.trandate BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      AND t.type = 'SalesOrd'
      AND t.status NOT IN ('Cancelled')
    GROUP BY 
      t.trandate
    ORDER BY 
      date ASC
  `;

  const response = await client.executeSuiteQL(query, { limit: 365 });
  return response.items;
}

/**
 * Get low stock items (below reorder point)
 */
export async function getLowStockItems(
  client: NetSuiteClient
): Promise<InventoryRecord[]> {
  const query = `
    SELECT 
      i.id as item_id,
      i.itemid as item_name,
      i.displayname as display_name,
      il.quantityavailable as quantity_available,
      il.quantityonhand as quantity_on_hand,
      il.quantitycommitted as quantity_committed,
      i.reorderpoint as reorder_point,
      l.name as location
    FROM 
      item i
    INNER JOIN 
      inventoryitemlocation il ON i.id = il.item
    INNER JOIN 
      location l ON il.location = l.id
    WHERE 
      i.isinactive = 'F'
      AND il.quantityavailable < i.reorderpoint
      AND i.reorderpoint > 0
    ORDER BY 
      (i.reorderpoint - il.quantityavailable) DESC
  `;

  const response = await client.executeSuiteQL<InventoryRecord>(query, {
    limit: 100,
  });
  return response.items;
}
