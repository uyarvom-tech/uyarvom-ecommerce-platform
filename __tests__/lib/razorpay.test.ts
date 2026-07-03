import { describe, it, expect } from 'vitest'
import {
  validateWebhookSignature,
  validatePaymentSignature,
  mapRazorpayStatus,
  isRefundEligible,
  isRetryAllowed,
  rupeesToPaise,
  paiseToRupees,
  RAZORPAY_EVENTS,
} from '@/lib/razorpay'
import crypto from 'crypto'

describe('Razorpay Utilities', () => {
  // ─── Webhook Signature Validation ─────────────────────────────────────────
  describe('validateWebhookSignature', () => {
    const secret = 'webhook_secret_123'

    it('returns true for valid signature', () => {
      const body = JSON.stringify({ event: 'payment.captured', payload: {} })
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      expect(validateWebhookSignature(body, signature, secret)).toBe(true)
    })

    it('returns false for invalid signature', () => {
      const body = JSON.stringify({ event: 'payment.captured' })
      expect(validateWebhookSignature(body, 'invalid_sig', secret)).toBe(false)
    })

    it('returns false for tampered body', () => {
      const body = JSON.stringify({ event: 'payment.captured' })
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      const tamperedBody = JSON.stringify({ event: 'payment.captured', hacked: true })
      expect(validateWebhookSignature(tamperedBody, signature, secret)).toBe(false)
    })

    it('returns false for empty inputs', () => {
      expect(validateWebhookSignature('', '', '')).toBe(false)
      expect(validateWebhookSignature('body', '', secret)).toBe(false)
      expect(validateWebhookSignature('body', 'sig', '')).toBe(false)
    })

    it('returns false for wrong secret', () => {
      const body = 'test-body'
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      expect(validateWebhookSignature(body, signature, 'wrong_secret')).toBe(false)
    })
  })

  // ─── Payment Signature Validation ─────────────────────────────────────────
  describe('validatePaymentSignature', () => {
    const secret = 'rzp_secret_456'
    const orderId = 'order_abc123'
    const paymentId = 'pay_xyz789'

    it('returns true for valid signature', () => {
      const body = `${orderId}|${paymentId}`
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      expect(validatePaymentSignature(orderId, paymentId, signature, secret)).toBe(true)
    })

    it('returns false for swapped order/payment IDs', () => {
      const body = `${orderId}|${paymentId}`
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      // Swap: payment_id|order_id
      expect(validatePaymentSignature(paymentId, orderId, signature, secret)).toBe(false)
    })

    it('returns false for empty inputs', () => {
      expect(validatePaymentSignature('', '', '', '')).toBe(false)
      expect(validatePaymentSignature(orderId, paymentId, '', secret)).toBe(false)
    })

    it('validates real-world flow correctly', () => {
      // Simulate what Razorpay sends after payment
      const rzpOrderId = 'order_L1234AbCdEfGhI'
      const rzpPaymentId = 'pay_M5678JkLmNoPqR'
      const rzpSecret = 'uXKBI0BMO5trcIM13FxCWQT5'
      const body = `${rzpOrderId}|${rzpPaymentId}`
      const sig = crypto.createHmac('sha256', rzpSecret).update(body).digest('hex')
      expect(validatePaymentSignature(rzpOrderId, rzpPaymentId, sig, rzpSecret)).toBe(true)
    })
  })

  // ─── Status Mapping ────────────────────────────────────────────────────────
  describe('mapRazorpayStatus', () => {
    it('maps created → pending', () => {
      expect(mapRazorpayStatus('created')).toBe('pending')
    })

    it('maps authorized → authorized', () => {
      expect(mapRazorpayStatus('authorized')).toBe('authorized')
    })

    it('maps captured → paid', () => {
      expect(mapRazorpayStatus('captured')).toBe('paid')
    })

    it('maps failed → failed', () => {
      expect(mapRazorpayStatus('failed')).toBe('failed')
    })

    it('maps refunded → refunded', () => {
      expect(mapRazorpayStatus('refunded')).toBe('refunded')
    })

    it('maps unknown → pending (default)', () => {
      expect(mapRazorpayStatus('some_random_status')).toBe('pending')
      expect(mapRazorpayStatus('')).toBe('pending')
    })
  })

  // ─── Refund Eligibility ────────────────────────────────────────────────────
  describe('isRefundEligible', () => {
    it('allows refund for paid online order', () => {
      const result = isRefundEligible({
        paymentStatus: 'paid',
        paymentMethod: 'online',
        razorpayPaymentId: 'pay_123',
        status: 'confirmed',
      })
      expect(result.eligible).toBe(true)
    })

    it('allows refund for partially_refunded order', () => {
      const result = isRefundEligible({
        paymentStatus: 'partially_refunded',
        paymentMethod: 'online',
        razorpayPaymentId: 'pay_123',
        status: 'confirmed',
      })
      expect(result.eligible).toBe(true)
    })

    it('rejects COD orders', () => {
      const result = isRefundEligible({
        paymentStatus: 'paid',
        paymentMethod: 'cod',
        razorpayPaymentId: null,
        status: 'confirmed',
      })
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('COD')
    })

    it('rejects orders without payment ID', () => {
      const result = isRefundEligible({
        paymentStatus: 'pending',
        paymentMethod: 'online',
        razorpayPaymentId: null,
        status: 'pending',
      })
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('No payment captured')
    })

    it('rejects already refunded orders', () => {
      const result = isRefundEligible({
        paymentStatus: 'refunded',
        paymentMethod: 'online',
        razorpayPaymentId: 'pay_123',
        status: 'cancelled',
      })
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('already fully refunded')
    })

    it('rejects failed payment orders', () => {
      const result = isRefundEligible({
        paymentStatus: 'failed',
        paymentMethod: 'online',
        razorpayPaymentId: 'pay_123',
        status: 'pending',
      })
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('Cannot refund')
    })
  })

  // ─── Payment Retry ─────────────────────────────────────────────────────────
  describe('isRetryAllowed', () => {
    it('allows retry for failed payment within 24h', () => {
      const result = isRetryAllowed({
        paymentStatus: 'failed',
        paymentMethod: 'online',
        status: 'pending',
        createdAt: new Date(), // just now
      })
      expect(result.allowed).toBe(true)
    })

    it('allows retry for pending payment within 24h', () => {
      const result = isRetryAllowed({
        paymentStatus: 'pending',
        paymentMethod: 'online',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      })
      expect(result.allowed).toBe(true)
    })

    it('rejects retry for already paid orders', () => {
      const result = isRetryAllowed({
        paymentStatus: 'paid',
        paymentMethod: 'online',
        status: 'confirmed',
        createdAt: new Date(),
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('already completed')
    })

    it('rejects retry for COD orders', () => {
      const result = isRetryAllowed({
        paymentStatus: 'pending',
        paymentMethod: 'cod',
        status: 'confirmed',
        createdAt: new Date(),
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('COD')
    })

    it('rejects retry for cancelled orders', () => {
      const result = isRetryAllowed({
        paymentStatus: 'failed',
        paymentMethod: 'online',
        status: 'cancelled',
        createdAt: new Date(),
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('cancelled')
    })

    it('rejects retry after 24h window', () => {
      const result = isRetryAllowed({
        paymentStatus: 'failed',
        paymentMethod: 'online',
        status: 'pending',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('allows retry just within the 24h window', () => {
      const result = isRetryAllowed({
        paymentStatus: 'failed',
        paymentMethod: 'online',
        status: 'pending',
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
      })
      expect(result.allowed).toBe(true)
    })
  })

  // ─── Amount Conversion ─────────────────────────────────────────────────────
  describe('rupeesToPaise', () => {
    it('converts correctly', () => {
      expect(rupeesToPaise(1)).toBe(100)
      expect(rupeesToPaise(499.99)).toBe(49999)
      expect(rupeesToPaise(0)).toBe(0)
      expect(rupeesToPaise(1.5)).toBe(150)
    })

    it('rounds to avoid floating point issues', () => {
      expect(rupeesToPaise(10.126)).toBe(1013) // rounds to nearest
      expect(rupeesToPaise(99.995)).toBe(10000) // rounds up
    })
  })

  describe('paiseToRupees', () => {
    it('converts correctly', () => {
      expect(paiseToRupees(100)).toBe(1)
      expect(paiseToRupees(49999)).toBe(499.99)
      expect(paiseToRupees(0)).toBe(0)
      expect(paiseToRupees(150)).toBe(1.5)
    })
  })

  // ─── Constants ─────────────────────────────────────────────────────────────
  describe('RAZORPAY_EVENTS', () => {
    it('defines all expected events', () => {
      expect(RAZORPAY_EVENTS.PAYMENT_CAPTURED).toBe('payment.captured')
      expect(RAZORPAY_EVENTS.PAYMENT_FAILED).toBe('payment.failed')
      expect(RAZORPAY_EVENTS.REFUND_PROCESSED).toBe('refund.processed')
      expect(RAZORPAY_EVENTS.DISPUTE_CREATED).toBe('payment.dispute.created')
      expect(RAZORPAY_EVENTS.DISPUTE_WON).toBe('payment.dispute.won')
      expect(RAZORPAY_EVENTS.DISPUTE_LOST).toBe('payment.dispute.lost')
    })
  })
})
