import { describe, it, expect } from 'vitest'
import {
  validateJournalEntry,
  calculateGST,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  calculateProfitAndLoss,
  validateBalanceSheet,
  calculateReconciliation,
  DEFAULT_ACCOUNTS,
} from '@/lib/finance'

describe('Finance & Accounting', () => {
  describe('Double-Entry Bookkeeping', () => {
    it('validates balanced journal entry', () => {
      const entry = {
        date: new Date(), description: 'Sale',
        lines: [
          { accountCode: '1000', debit: 1000, credit: 0 },
          { accountCode: '4000', debit: 0, credit: 1000 },
        ],
      }
      expect(validateJournalEntry(entry).valid).toBe(true)
    })

    it('rejects unbalanced entry', () => {
      const entry = {
        date: new Date(), description: 'Bad',
        lines: [
          { accountCode: '1000', debit: 1000, credit: 0 },
          { accountCode: '4000', debit: 0, credit: 500 },
        ],
      }
      const result = validateJournalEntry(entry)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must equal')
    })

    it('rejects entry with less than 2 lines', () => {
      const entry = {
        date: new Date(), description: 'One',
        lines: [{ accountCode: '1000', debit: 100, credit: 0 }],
      }
      expect(validateJournalEntry(entry).valid).toBe(false)
    })

    it('rejects line with both debit and credit', () => {
      const entry = {
        date: new Date(), description: 'Both',
        lines: [
          { accountCode: '1000', debit: 100, credit: 50 },
          { accountCode: '4000', debit: 0, credit: 50 },
        ],
      }
      expect(validateJournalEntry(entry).valid).toBe(false)
    })

    it('rejects negative amounts', () => {
      const entry = {
        date: new Date(), description: 'Neg',
        lines: [
          { accountCode: '1000', debit: -100, credit: 0 },
          { accountCode: '4000', debit: 0, credit: -100 },
        ],
      }
      expect(validateJournalEntry(entry).valid).toBe(false)
    })

    it('rejects zero amounts', () => {
      const entry = {
        date: new Date(), description: 'Zero',
        lines: [
          { accountCode: '1000', debit: 0, credit: 0 },
          { accountCode: '4000', debit: 0, credit: 0 },
        ],
      }
      expect(validateJournalEntry(entry).valid).toBe(false)
    })
  })

  describe('GST Calculations', () => {
    it('calculates intra-state GST (CGST + SGST)', () => {
      const gst = calculateGST(1000, 18, false)
      expect(gst.cgst).toBe(90)
      expect(gst.sgst).toBe(90)
      expect(gst.igst).toBe(0)
      expect(gst.totalTax).toBe(180)
      expect(gst.totalWithTax).toBe(1180)
    })

    it('calculates inter-state GST (IGST)', () => {
      const gst = calculateGST(1000, 18, true)
      expect(gst.cgst).toBe(0)
      expect(gst.sgst).toBe(0)
      expect(gst.igst).toBe(180)
      expect(gst.totalTax).toBe(180)
    })

    it('handles 5% GST rate', () => {
      const gst = calculateGST(1000, 5, false)
      expect(gst.cgst).toBe(25)
      expect(gst.sgst).toBe(25)
      expect(gst.totalTax).toBe(50)
    })

    it('handles zero amount', () => {
      const gst = calculateGST(0, 18)
      expect(gst.totalTax).toBe(0)
    })
  })

  describe('Invoice Calculations', () => {
    it('calculates simple invoice totals', () => {
      const items = [
        { description: 'Bowl', quantity: 2, unitPrice: 500, discount: 0, gstRate: 18, amount: 1000 },
      ]
      const totals = calculateInvoiceTotals(items)
      expect(totals.subtotal).toBe(1000)
      expect(totals.taxableAmount).toBe(1000)
      expect(totals.totalGST).toBe(180)
      expect(totals.grandTotal).toBe(1180)
      expect(totals.amountDue).toBe(1180)
    })

    it('applies discount before tax', () => {
      const items = [
        { description: 'Bowl', quantity: 1, unitPrice: 1000, discount: 10, gstRate: 18, amount: 900 },
      ]
      const totals = calculateInvoiceTotals(items)
      expect(totals.totalDiscount).toBe(100) // 10% of 1000
      expect(totals.taxableAmount).toBe(900) // 1000 - 100
      expect(totals.totalGST).toBe(162) // 18% of 900
      expect(totals.grandTotal).toBe(1062) // 900 + 162
    })

    it('calculates amount due after partial payment', () => {
      const items = [
        { description: 'A', quantity: 1, unitPrice: 1000, discount: 0, gstRate: 18, amount: 1000 },
      ]
      const totals = calculateInvoiceTotals(items, 500)
      expect(totals.grandTotal).toBe(1180)
      expect(totals.amountDue).toBe(680) // 1180 - 500
    })

    it('handles empty items', () => {
      const totals = calculateInvoiceTotals([])
      expect(totals.grandTotal).toBe(0)
    })
  })

  describe('Invoice Number Generation', () => {
    it('generates sales invoice number', () => {
      const num = generateInvoiceNumber('sales')
      expect(num).toMatch(/^INV-\d{4}-[A-Z0-9]{4}$/)
    })

    it('generates purchase invoice number', () => {
      const num = generateInvoiceNumber('purchase')
      expect(num.startsWith('PINV-')).toBe(true)
    })

    it('generates credit note number', () => {
      const num = generateInvoiceNumber('credit_note')
      expect(num.startsWith('CN-')).toBe(true)
    })
  })

  describe('Profit & Loss', () => {
    it('calculates P&L correctly', () => {
      const pnl = calculateProfitAndLoss(100000, 5000, 1000, 50000, 3000, 2000, 5000, 10000)
      expect(pnl.revenue.total).toBe(106000) // 100k + 5k + 1k
      expect(pnl.grossProfit).toBe(56000) // 106k - 50k
      expect(pnl.expenses.total).toBe(20000) // 3k+2k+5k+10k
      expect(pnl.netProfit).toBe(36000) // 56k - 20k
    })

    it('calculates margins as percentages', () => {
      const pnl = calculateProfitAndLoss(100000, 0, 0, 40000, 0, 0, 0, 0)
      expect(pnl.grossMargin).toBe(60) // 60k/100k * 100
      expect(pnl.netMargin).toBe(60)
    })

    it('handles zero revenue', () => {
      const pnl = calculateProfitAndLoss(0, 0, 0, 0, 0, 0, 0, 0)
      expect(pnl.grossMargin).toBe(0)
      expect(pnl.netMargin).toBe(0)
    })
  })

  describe('Balance Sheet Validation', () => {
    it('validates balanced sheet', () => {
      const result = validateBalanceSheet(100000, 40000, 60000)
      expect(result.balanced).toBe(true)
    })

    it('detects imbalanced sheet', () => {
      const result = validateBalanceSheet(100000, 40000, 50000)
      expect(result.balanced).toBe(false)
      expect(result.difference).toBe(10000)
    })
  })

  describe('Bank Reconciliation', () => {
    it('reconciles when balanced', () => {
      const result = calculateReconciliation(50000, 50000, [])
      expect(result.isReconciled).toBe(true)
      expect(result.difference).toBe(0)
    })

    it('identifies unreconciled difference', () => {
      const unmatched = [
        { id: '1', date: new Date(), description: 'Check', amount: 5000, type: 'debit' as const, matched: false },
      ]
      const result = calculateReconciliation(50000, 45000, unmatched)
      expect(result.isReconciled).toBe(false)
      expect(result.unmatchedDebits).toBe(5000)
    })
  })

  describe('Chart of Accounts', () => {
    it('has all account types', () => {
      const types = [...new Set(DEFAULT_ACCOUNTS.map(a => a.type))]
      expect(types).toContain('asset')
      expect(types).toContain('liability')
      expect(types).toContain('equity')
      expect(types).toContain('revenue')
      expect(types).toContain('expense')
    })

    it('has unique account codes', () => {
      const codes = DEFAULT_ACCOUNTS.map(a => a.code)
      expect(new Set(codes).size).toBe(codes.length)
    })
  })
})
