/**
 * Finance & Accounting — Core business logic
 * Handles double-entry bookkeeping, invoicing, GST, P&L, and balance sheet.
 */

// ─── Chart of Accounts ───────────────────────────────────────────────────────

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export const DEFAULT_ACCOUNTS: { code: string; name: string; type: AccountType }[] = [
  // Assets
  { code: '1000', name: 'Cash & Bank', type: 'asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' },
  { code: '1200', name: 'Inventory', type: 'asset' },
  { code: '1300', name: 'Prepaid Expenses', type: 'asset' },
  // Liabilities
  { code: '2000', name: 'Accounts Payable', type: 'liability' },
  { code: '2100', name: 'GST Payable', type: 'liability' },
  { code: '2200', name: 'Customer Advances', type: 'liability' },
  // Equity
  { code: '3000', name: 'Owner\'s Equity', type: 'equity' },
  { code: '3100', name: 'Retained Earnings', type: 'equity' },
  // Revenue
  { code: '4000', name: 'Sales Revenue', type: 'revenue' },
  { code: '4100', name: 'Shipping Revenue', type: 'revenue' },
  { code: '4200', name: 'Other Income', type: 'revenue' },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
  { code: '5100', name: 'Shipping Expense', type: 'expense' },
  { code: '5200', name: 'Platform Fees', type: 'expense' },
  { code: '5300', name: 'Marketing Expense', type: 'expense' },
  { code: '5400', name: 'Operating Expenses', type: 'expense' },
]

// ─── Double-Entry Bookkeeping ────────────────────────────────────────────────

export interface JournalEntry {
  date: Date
  description: string
  reference?: string
  lines: JournalLine[]
}

export interface JournalLine {
  accountCode: string
  debit: number
  credit: number
}

/**
 * Validate a journal entry (debits must equal credits).
 */
export function validateJournalEntry(entry: JournalEntry): { valid: boolean; error?: string } {
  if (!entry.lines || entry.lines.length < 2) {
    return { valid: false, error: 'Journal entry must have at least 2 lines' }
  }

  const totalDebits = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0)
  const totalCredits = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0)

  // Allow for floating point tolerance
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return { valid: false, error: `Debits (₹${totalDebits.toFixed(2)}) must equal Credits (₹${totalCredits.toFixed(2)})` }
  }

  for (const line of entry.lines) {
    if (line.debit < 0 || line.credit < 0) {
      return { valid: false, error: 'Debit and credit amounts must be non-negative' }
    }
    if (line.debit > 0 && line.credit > 0) {
      return { valid: false, error: 'A line cannot have both debit and credit' }
    }
    if (line.debit === 0 && line.credit === 0) {
      return { valid: false, error: 'Each line must have either a debit or credit amount' }
    }
  }

  return { valid: true }
}

// ─── GST Calculations ────────────────────────────────────────────────────────

export type GSTType = 'CGST' | 'SGST' | 'IGST'

export interface GSTBreakdown {
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  totalWithTax: number
  gstRate: number
  isInterState: boolean
}

/**
 * Calculate GST breakdown for an amount.
 * Intra-state: split into CGST + SGST (equal halves)
 * Inter-state: IGST (full rate)
 */
export function calculateGST(amount: number, gstRate: number = 18, isInterState: boolean = false): GSTBreakdown {
  const taxableAmount = amount
  const totalTax = Math.round(taxableAmount * (gstRate / 100) * 100) / 100

  if (isInterState) {
    return { taxableAmount, cgst: 0, sgst: 0, igst: totalTax, totalTax, totalWithTax: taxableAmount + totalTax, gstRate, isInterState }
  }

  const halfTax = Math.round((totalTax / 2) * 100) / 100
  return { taxableAmount, cgst: halfTax, sgst: halfTax, igst: 0, totalTax: halfTax * 2, totalWithTax: taxableAmount + halfTax * 2, gstRate, isInterState }
}

// ─── Invoice Generation ──────────────────────────────────────────────────────

export type InvoiceType = 'sales' | 'purchase' | 'credit_note' | 'debit_note'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  discount: number // percentage
  gstRate: number
  amount: number
}

export interface InvoiceTotals {
  subtotal: number
  totalDiscount: number
  taxableAmount: number
  totalGST: number
  grandTotal: number
  amountDue: number
}

/**
 * Calculate invoice totals from line items.
 */
export function calculateInvoiceTotals(items: InvoiceLineItem[], paidAmount: number = 0): InvoiceTotals {
  let subtotal = 0
  let totalDiscount = 0
  let taxableAmount = 0
  let totalGST = 0

  for (const item of items) {
    const lineSubtotal = item.quantity * item.unitPrice
    const lineDiscount = lineSubtotal * (item.discount / 100)
    const lineTaxable = lineSubtotal - lineDiscount
    const lineGST = lineTaxable * (item.gstRate / 100)

    subtotal += lineSubtotal
    totalDiscount += lineDiscount
    taxableAmount += lineTaxable
    totalGST += lineGST
  }

  const grandTotal = Math.round((taxableAmount + totalGST) * 100) / 100
  const amountDue = Math.max(0, grandTotal - paidAmount)

  return { subtotal, totalDiscount, taxableAmount, totalGST: Math.round(totalGST * 100) / 100, grandTotal, amountDue }
}

/**
 * Generate invoice number.
 */
export function generateInvoiceNumber(type: InvoiceType = 'sales'): string {
  const prefix = type === 'sales' ? 'INV' : type === 'purchase' ? 'PINV' : type === 'credit_note' ? 'CN' : 'DN'
  const date = new Date()
  const yr = date.getFullYear().toString().slice(-2)
  const mo = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${yr}${mo}-${random}`
}

// ─── Financial Statements ────────────────────────────────────────────────────

export interface ProfitAndLoss {
  period: { from: Date; to: Date }
  revenue: { sales: number; shipping: number; other: number; total: number }
  cogs: number
  grossProfit: number
  grossMargin: number
  expenses: { shipping: number; platform: number; marketing: number; operations: number; total: number }
  netProfit: number
  netMargin: number
}

/**
 * Calculate Profit & Loss from revenue and expense data.
 */
export function calculateProfitAndLoss(
  salesRevenue: number,
  shippingRevenue: number,
  otherIncome: number,
  cogs: number,
  shippingExpense: number,
  platformFees: number,
  marketingExpense: number,
  operationsExpense: number,
): Omit<ProfitAndLoss, 'period'> {
  const totalRevenue = salesRevenue + shippingRevenue + otherIncome
  const grossProfit = totalRevenue - cogs
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100 * 10) / 10 : 0
  const totalExpenses = shippingExpense + platformFees + marketingExpense + operationsExpense
  const netProfit = grossProfit - totalExpenses
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10 : 0

  return {
    revenue: { sales: salesRevenue, shipping: shippingRevenue, other: otherIncome, total: totalRevenue },
    cogs,
    grossProfit,
    grossMargin,
    expenses: { shipping: shippingExpense, platform: platformFees, marketing: marketingExpense, operations: operationsExpense, total: totalExpenses },
    netProfit,
    netMargin,
  }
}

export interface BalanceSheet {
  date: Date
  assets: { cash: number; receivables: number; inventory: number; total: number }
  liabilities: { payables: number; gstPayable: number; advances: number; total: number }
  equity: { ownersEquity: number; retainedEarnings: number; total: number }
  isBalanced: boolean
}

/**
 * Check if balance sheet balances (Assets = Liabilities + Equity).
 */
export function validateBalanceSheet(
  totalAssets: number,
  totalLiabilities: number,
  totalEquity: number,
): { balanced: boolean; difference: number } {
  const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity))
  return { balanced: difference < 0.01, difference }
}

// ─── Bank Reconciliation ─────────────────────────────────────────────────────

export interface ReconciliationItem {
  id: string
  date: Date
  description: string
  amount: number
  type: 'debit' | 'credit'
  matched: boolean
  bankRef?: string
}

/**
 * Calculate reconciliation summary.
 */
export function calculateReconciliation(
  bookBalance: number,
  bankBalance: number,
  unmatchedItems: ReconciliationItem[],
): { difference: number; isReconciled: boolean; unmatchedDebits: number; unmatchedCredits: number } {
  const unmatchedDebits = unmatchedItems.filter(i => i.type === 'debit').reduce((s, i) => s + i.amount, 0)
  const unmatchedCredits = unmatchedItems.filter(i => i.type === 'credit').reduce((s, i) => s + i.amount, 0)
  const difference = Math.abs(bookBalance - bankBalance)

  return { difference, isReconciled: difference < 0.01, unmatchedDebits, unmatchedCredits }
}
