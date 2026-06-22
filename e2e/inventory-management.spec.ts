import { test, expect } from '@playwright/test'

/**
 * Phase 2 Inventory Management — UI Smoke Tests
 */

test.describe('Inventory Management - Access Control', () => {
  test('inventory page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/inventory')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })
})

test.describe('Inventory Management - API Auth', () => {
  test('GET /api/admin/inventory/history returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/inventory/history')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/inventory/adjust returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/inventory/adjust', {
      data: { variantId: 'x', type: 'increment', quantity: 1, reason: 'received' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/admin/inventory/warehouses returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/inventory/warehouses')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/inventory/warehouses returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/inventory/warehouses', {
      data: { name: 'Test', code: 'WH-T' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/admin/inventory/transfers returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/inventory/transfers')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/inventory/transfers returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/inventory/transfers', {
      data: { sourceWarehouseId: 'x', destinationWarehouseId: 'y', items: [] },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/admin/inventory/forecast returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/inventory/forecast')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/inventory/reserve returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/inventory/reserve', {
      data: { variantId: 'x', quantity: 1 },
    })
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/admin/inventory/reserve returns 401 unauthenticated', async ({ request }) => {
    const res = await request.delete('/api/admin/inventory/reserve', {
      data: { variantId: 'x', quantity: 1 },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/inventory/replenish returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/inventory/replenish')
    expect(res.status()).toBe(401)
  })
})
