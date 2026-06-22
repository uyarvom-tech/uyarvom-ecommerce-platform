import { test, expect } from '@playwright/test'

test.describe('Procurement - API Auth', () => {
  test('GET /api/admin/vendors returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/vendors')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/vendors returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/vendors', { data: { name: 'Test', code: 'T' } })
    expect(res.status()).toBe(401)
  })

  test('GET /api/admin/vendors/test returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/vendors/test')
    expect(res.status()).toBe(401)
  })

  test('PUT /api/admin/vendors/test returns 401 unauthenticated', async ({ request }) => {
    const res = await request.put('/api/admin/vendors/test', { data: { name: 'X' } })
    expect(res.status()).toBe(401)
  })

  test('DELETE /api/admin/vendors/test returns 401 unauthenticated', async ({ request }) => {
    const res = await request.delete('/api/admin/vendors/test')
    expect(res.status()).toBe(401)
  })

  test('GET /api/admin/purchase-orders returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/purchase-orders')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/purchase-orders returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/purchase-orders', { data: {} })
    expect(res.status()).toBe(401)
  })

  test('GET /api/admin/purchase-orders/test returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/purchase-orders/test')
    expect(res.status()).toBe(401)
  })

  test('PUT /api/admin/purchase-orders/test returns 401 unauthenticated', async ({ request }) => {
    const res = await request.put('/api/admin/purchase-orders/test', { data: { status: 'approved' } })
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/purchase-orders/test/receive returns 401 unauthenticated', async ({ request }) => {
    const res = await request.post('/api/admin/purchase-orders/test/receive', { data: { items: [] } })
    expect(res.status()).toBe(401)
  })
})
