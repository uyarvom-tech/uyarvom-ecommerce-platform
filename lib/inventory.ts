/**
 * Inventory Management — Core business logic
 * Handles multi-warehouse stock, transfers, adjustments, forecasting, and batch tracking.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdjustmentReason =
  | 'received'         // Stock received from supplier
  | 'returned'         // Customer return
  | 'damaged'          // Damaged goods written off
  | 'lost'            // Inventory shrinkage / lost
  | 'correction'      // Manual count correction
  | 'transfer_in'     // Received from another warehouse
  | 'transfer_out'    // Sent to another warehouse
  | 'reserved'        // Reserved for order
  | 'released'        // Released from cancelled order
  | 'sold'            // Sold to customer

export const ADJUSTMENT_REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'received', label: 'Stock Received (Supplier)' },
  { value: 'returned', label: 'Customer Return' },
  { value: 'damaged', label: 'Damaged / Write-off' },
  { value: 'lost', label: 'Lost / Shrinkage' },
  { value: 'correction', label: 'Inventory Count Correction' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'reserved', label: 'Reserved for Order' },
  { value: 'released', label: 'Released from Order' },
  { value: 'sold', label: 'Sold' },
]

export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled'

export interface Warehouse {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  isActive: boolean
  isDefault: boolean
}

export interface StockMovement {
  variantId: string
  quantity: number
  type: 'increment' | 'decrement' | 'set'
  reason: AdjustmentReason
  reference?: string // Order ID, Transfer ID, etc.
  batchNumber?: string
  expiryDate?: Date
}

// ─── Forecasting ─────────────────────────────────────────────────────────────

export interface ForecastResult {
  variantId: string
  productName: string
  currentStock: number
  avgDailySales: number
  daysOfStockRemaining: number
  suggestedReorderQuantity: number
  reorderPoint: number
  status: 'critical' | 'low' | 'adequate' | 'overstocked'
}

/**
 * Calculate basic demand forecast based on sales velocity.
 * Uses a simple moving average over the specified number of days.
 */
export function calculateForecast(
  currentStock: number,
  totalSoldInPeriod: number,
  periodDays: number,
  leadTimeDays: number = 7,
  safetyStockDays: number = 3,
): Pick<ForecastResult, 'avgDailySales' | 'daysOfStockRemaining' | 'suggestedReorderQuantity' | 'reorderPoint' | 'status'> {
  const avgDailySales = periodDays > 0 ? totalSoldInPeriod / periodDays : 0
  const daysOfStockRemaining = avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : Infinity

  // Reorder point = (Lead time + Safety stock) × Average daily sales
  const reorderPoint = Math.ceil((leadTimeDays + safetyStockDays) * avgDailySales)

  // Suggested reorder = enough stock for lead time + 30 days buffer
  const suggestedReorderQuantity = Math.max(
    0,
    Math.ceil((leadTimeDays + 30) * avgDailySales) - currentStock
  )

  let status: ForecastResult['status']
  if (currentStock <= 0) {
    status = 'critical'
  } else if (currentStock <= reorderPoint) {
    status = 'low'
  } else if (avgDailySales > 0 && currentStock > avgDailySales * 90) {
    status = 'overstocked'
  } else {
    status = 'adequate'
  }

  return { avgDailySales, daysOfStockRemaining, suggestedReorderQuantity, reorderPoint, status }
}

// ─── Stock Validation ────────────────────────────────────────────────────────

/**
 * Validate that a stock adjustment is permissible.
 */
export function validateStockAdjustment(
  currentStock: number,
  adjustment: { type: 'increment' | 'decrement' | 'set'; quantity: number }
): { valid: boolean; error?: string; resultingStock: number } {
  const { type, quantity } = adjustment

  if (!Number.isFinite(quantity) || quantity < 0) {
    return { valid: false, error: 'Quantity must be a non-negative number', resultingStock: currentStock }
  }

  let resultingStock: number

  switch (type) {
    case 'increment':
      resultingStock = currentStock + quantity
      break
    case 'decrement':
      resultingStock = currentStock - quantity
      if (resultingStock < 0) {
        return { valid: false, error: `Insufficient stock. Current: ${currentStock}, Decrement: ${quantity}`, resultingStock: currentStock }
      }
      break
    case 'set':
      resultingStock = quantity
      break
    default:
      return { valid: false, error: 'Invalid adjustment type', resultingStock: currentStock }
  }

  if (resultingStock > 999999) {
    return { valid: false, error: 'Stock cannot exceed 999,999 units', resultingStock: currentStock }
  }

  return { valid: true, resultingStock }
}

// ─── Transfer Validation ─────────────────────────────────────────────────────

export function validateTransfer(
  sourceStock: number,
  quantity: number,
  sourceWarehouseId: string,
  destinationWarehouseId: string,
): { valid: boolean; error?: string } {
  if (sourceWarehouseId === destinationWarehouseId) {
    return { valid: false, error: 'Source and destination warehouses must be different' }
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { valid: false, error: 'Transfer quantity must be a positive number' }
  }

  if (quantity > sourceStock) {
    return { valid: false, error: `Insufficient stock at source. Available: ${sourceStock}, Requested: ${quantity}` }
  }

  return { valid: true }
}

// ─── Batch/Lot Helpers ───────────────────────────────────────────────────────

export function generateBatchNumber(prefix: string = 'LOT'): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${dateStr}-${random}`
}

export function isExpired(expiryDate: Date | string | null): boolean {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  return expiry < new Date()
}

export function daysUntilExpiry(expiryDate: Date | string | null): number | null {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
