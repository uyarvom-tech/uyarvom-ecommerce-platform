import { test, expect } from '@playwright/test'

test.describe('WMS - API Auth Guards', () => {
  test('GET /api/admin/wms/bins returns 401', async ({ request }) => {
    expect((await request.get('/api/admin/wms/bins')).status()).toBe(401)
  })
  test('POST /api/admin/wms/bins returns 401', async ({ request }) => {
    expect((await request.post('/api/admin/wms/bins', { data: {} })).status()).toBe(401)
  })
  test('GET /api/admin/wms/pick-lists returns 401', async ({ request }) => {
    expect((await request.get('/api/admin/wms/pick-lists')).status()).toBe(401)
  })
  test('POST /api/admin/wms/pick-lists returns 401', async ({ request }) => {
    expect((await request.post('/api/admin/wms/pick-lists', { data: {} })).status()).toBe(401)
  })
  test('POST /api/admin/wms/pack returns 401', async ({ request }) => {
    expect((await request.post('/api/admin/wms/pack', { data: {} })).status()).toBe(401)
  })
  test('GET /api/admin/wms/cycle-counts returns 401', async ({ request }) => {
    expect((await request.get('/api/admin/wms/cycle-counts')).status()).toBe(401)
  })
  test('POST /api/admin/wms/cycle-counts returns 401', async ({ request }) => {
    expect((await request.post('/api/admin/wms/cycle-counts', { data: {} })).status()).toBe(401)
  })
  test('PUT /api/admin/wms/cycle-counts returns 401', async ({ request }) => {
    expect((await request.put('/api/admin/wms/cycle-counts', { data: {} })).status()).toBe(401)
  })
})
