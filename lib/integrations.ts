/**
 * External Integrations — Adapter layer
 * Provides unified interfaces for payment gateways, shipping providers, and marketplace connectors.
 * Each integration can be enabled/disabled via environment variables.
 */

// ─── Payment Gateway Adapters ────────────────────────────────────────────────

export type PaymentProvider = 'razorpay' | 'stripe' | 'paypal'

export interface PaymentCreateParams {
  amount: number // in smallest currency unit (paise for INR, cents for USD)
  currency: string
  orderId: string
  customerEmail: string
  customerName: string
  description?: string
}

export interface PaymentResult {
  success: boolean
  providerId: string // Provider's order/payment ID
  redirectUrl?: string // For redirect-based flows
  clientSecret?: string // For client-side confirmation (Stripe)
  error?: string
}

export interface PaymentVerification {
  verified: boolean
  paymentId: string
  orderId: string
  amount: number
  status: 'captured' | 'authorized' | 'failed'
  error?: string
}

/**
 * Stripe integration adapter.
 * Creates payment intents for card/UPI payments.
 */
export function createStripePaymentParams(params: PaymentCreateParams): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  return {
    endpoint: 'https://api.stripe.com/v1/payment_intents',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY || ''}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: {
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      metadata: { orderId: params.orderId },
      receipt_email: params.customerEmail,
      description: params.description || `Order ${params.orderId}`,
    },
  }
}

/**
 * PayPal integration adapter.
 * Creates orders for checkout approval.
 */
export function createPayPalOrderParams(params: PaymentCreateParams): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  const isLive = process.env.PAYPAL_MODE === 'live'
  const baseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  return {
    endpoint: `${baseUrl}/v2/checkout/orders`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PAYPAL_ACCESS_TOKEN || ''}`,
    },
    body: {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: params.orderId,
        amount: {
          currency_code: params.currency,
          value: (params.amount / 100).toFixed(2), // PayPal uses full units
        },
        description: params.description || `Order ${params.orderId}`,
      }],
      payer: {
        email_address: params.customerEmail,
        name: { given_name: params.customerName.split(' ')[0], surname: params.customerName.split(' ').slice(1).join(' ') || '' },
      },
    },
  }
}

// ─── Shipping Provider Adapters ──────────────────────────────────────────────

export type ShippingProvider = 'delhivery' | 'bluedart' | 'fedex'

export interface ShipmentCreateParams {
  orderId: string
  awb?: string
  weight: number // grams
  dimensions?: { length: number; width: number; height: number }
  pickup: { address: string; city: string; state: string; pincode: string; phone: string }
  delivery: { name: string; address: string; city: string; state: string; pincode: string; phone: string }
  isCOD: boolean
  codAmount?: number
  items: Array<{ name: string; sku: string; quantity: number }>
}

/**
 * Delhivery API adapter — Create shipment request.
 */
export function createDelhiveryShipmentParams(params: ShipmentCreateParams): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  return {
    endpoint: 'https://track.delhivery.com/api/cmu/create.json',
    headers: {
      'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN || ''}`,
      'Content-Type': 'application/json',
    },
    body: {
      shipments: [{
        name: params.delivery.name,
        add: params.delivery.address,
        city: params.delivery.city,
        state: params.delivery.state,
        pin: params.delivery.pincode,
        phone: params.delivery.phone,
        order: params.orderId,
        payment_mode: params.isCOD ? 'COD' : 'Pre-paid',
        cod_amount: params.isCOD ? params.codAmount?.toString() : '0',
        weight: params.weight,
        shipment_width: params.dimensions?.width || 10,
        shipment_height: params.dimensions?.height || 10,
        shipment_length: params.dimensions?.length || 10,
        products_desc: params.items.map(i => `${i.name} x${i.quantity}`).join(', '),
      }],
      pickup_location: { name: 'Uyarvom Warehouse', ...params.pickup },
    },
  }
}

/**
 * Blue Dart API adapter.
 */
export function createBlueDartShipmentParams(params: ShipmentCreateParams): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  return {
    endpoint: 'https://netconnect.bluedart.com/API-QA/Ver1.10/ShippingAPI/WayBill/WayBillGeneration',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BLUEDART_API_KEY || ''}`,
    },
    body: {
      Request: {
        Consignee: {
          ConsigneeName: params.delivery.name,
          ConsigneeAddress1: params.delivery.address,
          ConsigneeCity: params.delivery.city,
          ConsigneePincode: params.delivery.pincode,
          ConsigneePhoneNumber: params.delivery.phone,
        },
        Services: {
          ActualWeight: (params.weight / 1000).toFixed(2),
          ProductCode: params.isCOD ? 'C' : 'D',
          CodCollection: params.isCOD ? params.codAmount : 0,
        },
        Shipper: {
          CustomerAddress1: params.pickup.address,
          CustomerCity: params.pickup.city,
          CustomerPincode: params.pickup.pincode,
        },
      },
    },
  }
}

/**
 * FedEx API adapter.
 */
export function createFedExShipmentParams(params: ShipmentCreateParams): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  return {
    endpoint: 'https://apis.fedex.com/ship/v1/shipments',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FEDEX_API_TOKEN || ''}`,
    },
    body: {
      requestedShipment: {
        shipper: { address: { city: params.pickup.city, stateOrProvinceCode: params.pickup.state, postalCode: params.pickup.pincode, countryCode: 'IN' } },
        recipients: [{ address: { city: params.delivery.city, stateOrProvinceCode: params.delivery.state, postalCode: params.delivery.pincode, countryCode: 'IN' } }],
        requestedPackageLineItems: [{ weight: { value: params.weight / 1000, units: 'KG' } }],
      },
    },
  }
}

// ─── Marketplace Connectors ──────────────────────────────────────────────────

export type Marketplace = 'amazon' | 'flipkart'

export interface MarketplaceProduct {
  sku: string
  title: string
  price: number
  stock: number
  description?: string
  images?: string[]
}

export interface MarketplaceOrder {
  marketplaceOrderId: string
  marketplace: Marketplace
  customerName: string
  items: Array<{ sku: string; quantity: number; price: number }>
  shippingAddress: { name: string; address: string; city: string; state: string; pincode: string }
  total: number
}

/**
 * Amazon SP-API adapter — Product listing sync.
 */
export function createAmazonProductFeedParams(products: MarketplaceProduct[]): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  return {
    endpoint: 'https://sellingpartnerapi-na.amazon.com/feeds/2021-06-30/feeds',
    headers: {
      'Content-Type': 'application/json',
      'x-amz-access-token': process.env.AMAZON_SP_ACCESS_TOKEN || '',
    },
    body: {
      feedType: 'POST_FLAT_FILE_INVLOADER_DATA',
      marketplaceIds: [process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV'], // India
      inputFeedDocumentId: 'placeholder', // Would be created via createFeedDocument first
      products: products.map(p => ({
        sku: p.sku,
        product_id_type: 'ASIN',
        item_name: p.title,
        standard_price: p.price,
        quantity: p.stock,
      })),
    },
  }
}

/**
 * Flipkart Seller API adapter.
 */
export function createFlipkartListingParams(products: MarketplaceProduct[]): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  return {
    endpoint: 'https://api.flipkart.net/sellers/listings/v3/',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FLIPKART_ACCESS_TOKEN || ''}`,
    },
    body: {
      listings: products.map(p => ({
        sku_id: p.sku,
        product_title: p.title,
        selling_price: p.price,
        stock_count: p.stock,
        listing_status: 'ACTIVE',
      })),
    },
  }
}

// ─── E-commerce Platform Connectors ──────────────────────────────────────────

export type EcommercePlatform = 'shopify' | 'woocommerce' | 'magento'

/**
 * Shopify product sync adapter.
 */
export function createShopifyProductParams(product: MarketplaceProduct): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN || 'store.myshopify.com'
  return {
    endpoint: `https://${shop}/admin/api/2024-01/products.json`,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN || '',
    },
    body: {
      product: {
        title: product.title,
        body_html: product.description || '',
        variants: [{ sku: product.sku, price: product.price.toString(), inventory_quantity: product.stock }],
        images: product.images?.map(url => ({ src: url })) || [],
      },
    },
  }
}

/**
 * WooCommerce REST API adapter.
 */
export function createWooCommerceProductParams(product: MarketplaceProduct): {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, any>
} {
  const baseUrl = process.env.WOOCOMMERCE_URL || 'https://store.example.com'
  const key = process.env.WOOCOMMERCE_KEY || ''
  const secret = process.env.WOOCOMMERCE_SECRET || ''

  return {
    endpoint: `${baseUrl}/wp-json/wc/v3/products`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
    },
    body: {
      name: product.title,
      sku: product.sku,
      regular_price: product.price.toString(),
      stock_quantity: product.stock,
      manage_stock: true,
      description: product.description || '',
      images: product.images?.map(url => ({ src: url })) || [],
    },
  }
}

// ─── Integration Status Check ────────────────────────────────────────────────

export interface IntegrationStatus {
  provider: string
  configured: boolean
  lastSync?: Date
  error?: string
}

/**
 * Check which integrations are configured via environment variables.
 */
export function getConfiguredIntegrations(): IntegrationStatus[] {
  return [
    { provider: 'razorpay', configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) },
    { provider: 'stripe', configured: !!process.env.STRIPE_SECRET_KEY },
    { provider: 'paypal', configured: !!process.env.PAYPAL_ACCESS_TOKEN },
    { provider: 'delhivery', configured: !!process.env.DELHIVERY_API_TOKEN },
    { provider: 'bluedart', configured: !!process.env.BLUEDART_API_KEY },
    { provider: 'fedex', configured: !!process.env.FEDEX_API_TOKEN },
    { provider: 'amazon', configured: !!process.env.AMAZON_SP_ACCESS_TOKEN },
    { provider: 'flipkart', configured: !!process.env.FLIPKART_ACCESS_TOKEN },
    { provider: 'shopify', configured: !!(process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN) },
    { provider: 'woocommerce', configured: !!(process.env.WOOCOMMERCE_URL && process.env.WOOCOMMERCE_KEY) },
    { provider: 'cloudflare_r2', configured: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) },
    { provider: 'supabase', configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { provider: 'gemini', configured: !!process.env.GEMINI_API_KEY },
  ]
}
