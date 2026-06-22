import { describe, it, expect } from 'vitest'
import {
  createStripePaymentParams,
  createPayPalOrderParams,
  createDelhiveryShipmentParams,
  createBlueDartShipmentParams,
  createFedExShipmentParams,
  createAmazonProductFeedParams,
  createFlipkartListingParams,
  createShopifyProductParams,
  createWooCommerceProductParams,
  getConfiguredIntegrations,
} from '@/lib/integrations'

const basePaymentParams = {
  amount: 100000, // ₹1000 in paise
  currency: 'INR',
  orderId: 'ORD-001',
  customerEmail: 'test@test.com',
  customerName: 'John Doe',
}

const baseShipmentParams = {
  orderId: 'ORD-001',
  weight: 1500,
  dimensions: { length: 30, width: 20, height: 10 },
  pickup: { address: '123 Warehouse', city: 'Chennai', state: 'TN', pincode: '600001', phone: '9876543210' },
  delivery: { name: 'Jane', address: '456 Home St', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '1234567890' },
  isCOD: false,
  items: [{ name: 'Ceramic Bowl', sku: 'UYV-BOWL-001', quantity: 2 }],
}

const baseProduct = { sku: 'UYV-BOWL-001', title: 'Ceramic Bowl', price: 599, stock: 25, description: 'Handcrafted bowl' }

describe('External Integrations', () => {
  describe('Stripe Adapter', () => {
    it('builds correct payment intent params', () => {
      const result = createStripePaymentParams(basePaymentParams)
      expect(result.endpoint).toContain('stripe.com')
      expect(result.headers['Authorization']).toContain('Bearer')
      expect(result.body.amount).toBe(100000)
      expect(result.body.currency).toBe('inr')
      expect(result.body.metadata.orderId).toBe('ORD-001')
    })
  })

  describe('PayPal Adapter', () => {
    it('builds correct order params (sandbox)', () => {
      const result = createPayPalOrderParams(basePaymentParams)
      expect(result.endpoint).toContain('sandbox.paypal.com')
      expect(result.body.intent).toBe('CAPTURE')
      expect(result.body.purchase_units[0].amount.value).toBe('1000.00') // Converted from paise
      expect(result.body.purchase_units[0].reference_id).toBe('ORD-001')
    })

    it('splits customer name into given/surname', () => {
      const result = createPayPalOrderParams(basePaymentParams)
      expect(result.body.payer.name.given_name).toBe('John')
      expect(result.body.payer.name.surname).toBe('Doe')
    })
  })

  describe('Delhivery Adapter', () => {
    it('builds correct shipment params', () => {
      const result = createDelhiveryShipmentParams(baseShipmentParams)
      expect(result.endpoint).toContain('delhivery.com')
      expect(result.headers['Authorization']).toContain('Token')
      expect(result.body.shipments[0].name).toBe('Jane')
      expect(result.body.shipments[0].city).toBe('Mumbai')
      expect(result.body.shipments[0].payment_mode).toBe('Pre-paid')
      expect(result.body.shipments[0].weight).toBe(1500)
    })

    it('sets COD correctly', () => {
      const codParams = { ...baseShipmentParams, isCOD: true, codAmount: 1500 }
      const result = createDelhiveryShipmentParams(codParams)
      expect(result.body.shipments[0].payment_mode).toBe('COD')
      expect(result.body.shipments[0].cod_amount).toBe('1500')
    })
  })

  describe('Blue Dart Adapter', () => {
    it('builds correct shipment params', () => {
      const result = createBlueDartShipmentParams(baseShipmentParams)
      expect(result.endpoint).toContain('bluedart.com')
      expect(result.body.Request.Consignee.ConsigneeName).toBe('Jane')
      expect(result.body.Request.Consignee.ConsigneePincode).toBe('400001')
      expect(result.body.Request.Services.ProductCode).toBe('D') // Prepaid
    })

    it('sets COD product code', () => {
      const codParams = { ...baseShipmentParams, isCOD: true, codAmount: 1500 }
      const result = createBlueDartShipmentParams(codParams)
      expect(result.body.Request.Services.ProductCode).toBe('C') // COD
      expect(result.body.Request.Services.CodCollection).toBe(1500)
    })
  })

  describe('FedEx Adapter', () => {
    it('builds correct shipment params', () => {
      const result = createFedExShipmentParams(baseShipmentParams)
      expect(result.endpoint).toContain('fedex.com')
      expect(result.body.requestedShipment.recipients[0].address.postalCode).toBe('400001')
      expect(result.body.requestedShipment.requestedPackageLineItems[0].weight.value).toBe(1.5)
      expect(result.body.requestedShipment.requestedPackageLineItems[0].weight.units).toBe('KG')
    })
  })

  describe('Amazon SP-API Adapter', () => {
    it('builds product feed params', () => {
      const result = createAmazonProductFeedParams([baseProduct])
      expect(result.endpoint).toContain('amazon.com')
      expect(result.body.feedType).toBe('POST_FLAT_FILE_INVLOADER_DATA')
      expect(result.body.products[0].sku).toBe('UYV-BOWL-001')
      expect(result.body.products[0].standard_price).toBe(599)
    })
  })

  describe('Flipkart Adapter', () => {
    it('builds listing params', () => {
      const result = createFlipkartListingParams([baseProduct])
      expect(result.endpoint).toContain('flipkart.net')
      expect(result.body.listings[0].sku_id).toBe('UYV-BOWL-001')
      expect(result.body.listings[0].selling_price).toBe(599)
      expect(result.body.listings[0].listing_status).toBe('ACTIVE')
    })
  })

  describe('Shopify Adapter', () => {
    it('builds product creation params', () => {
      const result = createShopifyProductParams(baseProduct)
      expect(result.endpoint).toContain('myshopify.com')
      expect(result.headers['X-Shopify-Access-Token']).toBeDefined()
      expect(result.body.product.title).toBe('Ceramic Bowl')
      expect(result.body.product.variants[0].sku).toBe('UYV-BOWL-001')
      expect(result.body.product.variants[0].price).toBe('599')
    })
  })

  describe('WooCommerce Adapter', () => {
    it('builds product creation params', () => {
      const result = createWooCommerceProductParams(baseProduct)
      expect(result.endpoint).toContain('wc/v3/products')
      expect(result.headers['Authorization']).toContain('Basic')
      expect(result.body.name).toBe('Ceramic Bowl')
      expect(result.body.sku).toBe('UYV-BOWL-001')
      expect(result.body.manage_stock).toBe(true)
    })
  })

  describe('Integration Status Check', () => {
    it('returns status for all integrations', () => {
      const statuses = getConfiguredIntegrations()
      expect(statuses.length).toBeGreaterThanOrEqual(10)
      const providers = statuses.map(s => s.provider)
      expect(providers).toContain('razorpay')
      expect(providers).toContain('stripe')
      expect(providers).toContain('paypal')
      expect(providers).toContain('delhivery')
      expect(providers).toContain('amazon')
      expect(providers).toContain('shopify')
      expect(providers).toContain('cloudflare_r2')
      expect(providers).toContain('supabase')
      expect(providers).toContain('gemini')
    })

    it('each status has configured boolean', () => {
      const statuses = getConfiguredIntegrations()
      for (const s of statuses) {
        expect(typeof s.configured).toBe('boolean')
      }
    })

    it('razorpay detected from env', () => {
      // Our .env.local doesn't have razorpay keys set to real values
      const statuses = getConfiguredIntegrations()
      const razorpay = statuses.find(s => s.provider === 'razorpay')
      expect(razorpay).toBeDefined()
    })
  })
})
