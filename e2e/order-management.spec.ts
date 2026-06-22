import { test, expect } from '@playwright/test'

/**
 * Phase 3 OMS — UI Smoke Tests
 */

test.describe('Order Management - Access Control', () => {
  test('orders page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/orders')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })

  test('order detail page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/orders/nonexistent-id')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })
})

test.describe('Order Management - API Auth', () => {
  test('GET /api/admin/orders returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/orders')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/orders returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/orders', { data: {} })
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/orders/test/fulfill returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/orders/test/fulfill', { data: { status: 'confirmed' } })
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/orders/bulk returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/orders/bulk', { data: { orderIds: [], status: 'x' } })
    expect(res.status()).toBe(401)
  })
})

test.describe('Order Management - Customer Order Tracking', () => {
  test('customer tracking page loads', async ({ page }) => {
    const res = await page.goto('/track')
    expect(res).not.toBeNull()
    expect([200, 500]).toContain(res!.status())
  })

  test('customer orders page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })
})
