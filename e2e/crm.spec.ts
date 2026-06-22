import { test, expect } from '@playwright/test'

test.describe('CRM - API Auth Guards', () => {
  test('GET /api/admin/customers returns 401', async ({ request }) => {
    expect((await request.get('/api/admin/customers')).status()).toBe(401)
  })
  test('GET /api/admin/customers/x returns 401', async ({ request }) => {
    expect((await request.get('/api/admin/customers/x')).status()).toBe(401)
  })
  test('POST /api/admin/customers/x/notes returns 401', async ({ request }) => {
    expect((await request.post('/api/admin/customers/x/notes', { data: { content: 'hi' } })).status()).toBe(401)
  })
  test('GET /api/admin/loyalty returns 401', async ({ request }) => {
    expect((await request.get('/api/admin/loyalty?userId=x')).status()).toBe(401)
  })
  test('POST /api/admin/loyalty returns 401', async ({ request }) => {
    expect((await request.post('/api/admin/loyalty', { data: { userId: 'x', type: 'earned', points: 1 } })).status()).toBe(401)
  })
  test('GET /api/admin/segments returns 401', async ({ request }) => {
    expect((await request.get('/api/admin/segments')).status()).toBe(401)
  })
  test('POST /api/admin/segments returns 401', async ({ request }) => {
    expect((await request.post('/api/admin/segments')).status()).toBe(401)
  })
})
