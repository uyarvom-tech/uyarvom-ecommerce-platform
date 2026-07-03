import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sendEmail,
  sendSMS,
  dispatchNotification,
  buildOrderPlacedNotification,
  buildShippingNotification,
  buildDeliveryNotification,
  buildDeliveryFailedNotification,
  buildRefundNotification,
  buildLowStockAlert,
  buildWelcomeEmail,
  buildPasswordResetEmail,
  DEFAULT_CUSTOMER_PREFERENCES,
  ADMIN_NOTIFICATION_EVENTS,
  isRetryAllowed,
  isRefundEligible,
} from '@/lib/notifications'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  // ─── Email Service ─────────────────────────────────────────────────────────
  describe('sendEmail', () => {
    it('returns error when RESEND_API_KEY is not configured', async () => {
      vi.stubEnv('RESEND_API_KEY', '')
      const result = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Hi</p>' })
      expect(result.success).toBe(false)
      expect(result.channel).toBe('email')
      expect(result.error).toContain('not configured')
    })

    it('sends email successfully via Resend API', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_resend_key')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'msg_123' }),
      })

      const result = await sendEmail({ to: 'user@example.com', subject: 'Hello', html: '<p>World</p>' })
      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg_123')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer test_resend_key' }),
        })
      )
    })

    it('handles Resend API errors gracefully', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_key')
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ message: 'Invalid email' }),
      })

      const result = await sendEmail({ to: 'bad@', subject: 'Test', html: '<p>Hi</p>' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('422')
    })

    it('handles network errors gracefully', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_key')
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      const result = await sendEmail({ to: 'test@x.com', subject: 'Test', html: '<p>Hi</p>' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Network timeout')
    })
  })

  // ─── SMS Service ───────────────────────────────────────────────────────────
  describe('sendSMS', () => {
    it('returns error when MSG91_AUTH_KEY is not configured', async () => {
      vi.stubEnv('MSG91_AUTH_KEY', '')
      const result = await sendSMS({ to: '+919876543210', message: 'Test' })
      expect(result.success).toBe(false)
      expect(result.channel).toBe('sms')
      expect(result.error).toContain('not configured')
    })

    it('sends SMS successfully via MSG91', async () => {
      vi.stubEnv('MSG91_AUTH_KEY', 'test_msg91_key')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ request_id: 'sms_456' }),
      })

      const result = await sendSMS({ to: '+919876543210', message: 'Your order shipped' })
      expect(result.success).toBe(true)
      expect(result.messageId).toBe('sms_456')
    })

    it('strips +91 prefix for MSG91', async () => {
      vi.stubEnv('MSG91_AUTH_KEY', 'test_key')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ request_id: 'sms_789' }),
      })

      await sendSMS({ to: '+919876543210', message: 'Test' })
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.sms[0].to[0]).toBe('9876543210')
    })
  })

  // ─── Notification Dispatcher ───────────────────────────────────────────────
  describe('dispatchNotification', () => {
    it('sends email and in-app for order_placed', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_key')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'e1' }),
      })

      const results = await dispatchNotification({
        event: 'order_placed',
        recipientEmail: 'test@x.com',
        recipientPhone: '+919876543210',
        subject: 'Order Placed',
        htmlBody: '<p>Order placed</p>',
        textBody: 'Order placed',
      })

      // Should have email + SMS (order_placed is in SMS list) + in_app
      expect(results.length).toBeGreaterThanOrEqual(2)
      expect(results.some(r => r.channel === 'email')).toBe(true)
      expect(results.some(r => r.channel === 'in_app')).toBe(true)
    })

    it('skips SMS for events not in SMS list', async () => {
      vi.stubEnv('RESEND_API_KEY', 'test_key')
      vi.stubEnv('MSG91_AUTH_KEY', 'test_sms')
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'e2' }),
      })

      const results = await dispatchNotification({
        event: 'welcome',
        recipientEmail: 'test@x.com',
        recipientPhone: '+919876543210',
        subject: 'Welcome!',
        htmlBody: '<p>Welcome</p>',
        textBody: 'Welcome',
      })

      // welcome is not in SMS events list
      expect(results.some(r => r.channel === 'sms')).toBe(false)
    })

    it('always includes in_app notification', async () => {
      const results = await dispatchNotification({
        event: 'order_placed',
        recipientUserId: 'user-1',
      })

      expect(results.some(r => r.channel === 'in_app' && r.success === true)).toBe(true)
    })
  })

  // ─── Notification Builders ─────────────────────────────────────────────────
  describe('buildOrderPlacedNotification', () => {
    it('builds correct email content for COD', () => {
      const notif = buildOrderPlacedNotification({
        orderNumber: 'ORD-123',
        total: 1499,
        customerName: 'Rahul',
        customerEmail: 'rahul@example.com',
        customerPhone: '+919876543210',
        paymentMethod: 'cod',
      })

      expect(notif.event).toBe('order_placed')
      expect(notif.subject).toContain('ORD-123')
      expect(notif.htmlBody).toContain('Rahul')
      expect(notif.htmlBody).toContain('1,499')
      expect(notif.htmlBody).toContain('Cash on Delivery')
      expect(notif.recipientEmail).toBe('rahul@example.com')
      expect(notif.recipientPhone).toBe('+919876543210')
    })

    it('builds correct content for online payment', () => {
      const notif = buildOrderPlacedNotification({
        orderNumber: 'ORD-456',
        total: 2999,
        customerName: 'Priya',
        customerEmail: 'priya@test.com',
        paymentMethod: 'online',
      })

      expect(notif.htmlBody).toContain('Online Payment')
    })

    it('handles null phone gracefully', () => {
      const notif = buildOrderPlacedNotification({
        orderNumber: 'ORD-789',
        total: 500,
        customerName: 'Test',
        customerEmail: 'test@x.com',
        customerPhone: null,
        paymentMethod: 'cod',
      })

      expect(notif.recipientPhone).toBeUndefined()
    })
  })

  describe('buildShippingNotification', () => {
    it('includes tracking info when available', () => {
      const notif = buildShippingNotification({
        orderNumber: 'ORD-100',
        customerName: 'Kumar',
        customerEmail: 'kumar@x.com',
        trackingNumber: 'DELHIVERY123',
        courierName: 'Delhivery',
      })

      expect(notif.htmlBody).toContain('DELHIVERY123')
      expect(notif.htmlBody).toContain('Delhivery')
      expect(notif.textBody).toContain('DELHIVERY123')
    })

    it('handles missing tracking gracefully', () => {
      const notif = buildShippingNotification({
        orderNumber: 'ORD-200',
        customerName: 'Anitha',
        customerEmail: 'anitha@x.com',
        trackingNumber: null,
        courierName: null,
      })

      expect(notif.htmlBody).toContain('updated soon')
      expect(notif.htmlBody).not.toContain('null')
    })
  })

  describe('buildDeliveryNotification', () => {
    it('builds delivered email', () => {
      const notif = buildDeliveryNotification({
        orderNumber: 'ORD-300',
        customerName: 'Vijay',
        customerEmail: 'vijay@x.com',
      })

      expect(notif.event).toBe('delivered')
      expect(notif.subject).toContain('delivered')
      expect(notif.htmlBody).toContain('Vijay')
    })
  })

  describe('buildDeliveryFailedNotification', () => {
    it('includes reason when provided', () => {
      const notif = buildDeliveryFailedNotification({
        orderNumber: 'ORD-400',
        customerName: 'Sita',
        customerEmail: 'sita@x.com',
        reason: 'Customer not available',
      })

      expect(notif.htmlBody).toContain('Customer not available')
    })

    it('works without reason', () => {
      const notif = buildDeliveryFailedNotification({
        orderNumber: 'ORD-500',
        customerName: 'Ram',
        customerEmail: 'ram@x.com',
      })

      expect(notif.htmlBody).not.toContain('undefined')
    })
  })

  describe('buildRefundNotification', () => {
    it('builds full refund notification', () => {
      const notif = buildRefundNotification({
        orderNumber: 'ORD-600',
        customerName: 'Lakshmi',
        customerEmail: 'lakshmi@x.com',
        refundAmount: 2500,
        isFullRefund: true,
      })

      expect(notif.htmlBody).toContain('full')
      expect(notif.htmlBody).toContain('2,500')
    })

    it('builds partial refund notification', () => {
      const notif = buildRefundNotification({
        orderNumber: 'ORD-700',
        customerName: 'Ganesh',
        customerEmail: 'ganesh@x.com',
        refundAmount: 500,
        isFullRefund: false,
      })

      expect(notif.htmlBody).toContain('partial')
    })
  })

  describe('buildLowStockAlert', () => {
    it('builds admin alert', () => {
      const notif = buildLowStockAlert({
        name: 'Ceramic Bowl',
        sku: 'CB-001',
        currentStock: 3,
        adminEmail: 'admin@uyarvom.com',
      })

      expect(notif.event).toBe('low_stock_alert')
      expect(notif.subject).toContain('Low Stock')
      expect(notif.htmlBody).toContain('CB-001')
      expect(notif.htmlBody).toContain('3')
    })
  })

  describe('buildWelcomeEmail', () => {
    it('builds welcome email with name', () => {
      const notif = buildWelcomeEmail({ name: 'Kavitha', email: 'kavitha@x.com' })
      expect(notif.event).toBe('welcome')
      expect(notif.htmlBody).toContain('Kavitha')
    })

    it('handles empty name', () => {
      const notif = buildWelcomeEmail({ name: '', email: 'anon@x.com' })
      expect(notif.htmlBody).toContain('there')
    })
  })

  describe('buildPasswordResetEmail', () => {
    it('builds reset email with link', () => {
      const notif = buildPasswordResetEmail({
        email: 'user@x.com',
        resetLink: 'https://uyarvom.com/reset?token=abc123',
      })
      expect(notif.subject).toContain('Reset')
      expect(notif.htmlBody).toContain('https://uyarvom.com/reset?token=abc123')
    })
  })

  // ─── Constants ─────────────────────────────────────────────────────────────
  describe('DEFAULT_CUSTOMER_PREFERENCES', () => {
    it('defines preferences for all customer events', () => {
      expect(DEFAULT_CUSTOMER_PREFERENCES.length).toBeGreaterThanOrEqual(10)
      expect(DEFAULT_CUSTOMER_PREFERENCES.every(p => p.event && typeof p.email === 'boolean')).toBe(true)
    })

    it('has email enabled for all events', () => {
      expect(DEFAULT_CUSTOMER_PREFERENCES.every(p => p.email === true)).toBe(true)
    })
  })

  describe('ADMIN_NOTIFICATION_EVENTS', () => {
    it('includes critical admin events', () => {
      expect(ADMIN_NOTIFICATION_EVENTS).toContain('order_placed')
      expect(ADMIN_NOTIFICATION_EVENTS).toContain('low_stock_alert')
      expect(ADMIN_NOTIFICATION_EVENTS).toContain('dispute_created')
    })
  })
})
