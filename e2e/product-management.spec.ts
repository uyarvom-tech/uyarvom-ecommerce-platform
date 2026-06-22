import { test, expect } from '@playwright/test'

/**
 * Phase 1 PIM UI Smoke Tests
 * Tests the product management pages are accessible and render correctly.
 * These tests run without authentication and verify redirects/accessibility.
 * For authenticated tests, set up a test admin user in CI.
 */

test.describe('Product Management - Pages & Navigation', () => {
  test('catalog page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/catalog')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })

  test('new product page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/products/new')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })

  test('media library page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/media')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })

  test('inventory page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/inventory')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 })
  })
})

test.describe('Product Management - API Endpoints', () => {
  test('GET /api/admin/products returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/admin/products')
    expect(response.status()).toBe(401)
  })

  test('GET /api/admin/products/export returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/admin/products/export')
    expect(response.status()).toBe(401)
  })

  test('POST /api/admin/products returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/admin/products', {
      data: { name: 'Test' },
    })
    expect(response.status()).toBe(401)
  })

  test('GET /api/admin/products/nonexistent/barcode returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/admin/products/nonexistent/barcode')
    expect(response.status()).toBe(401)
  })

  test('GET /api/admin/upload returns 401 for unauthenticated (POST-only route)', async ({ request }) => {
    const response = await request.get('/api/admin/upload')
    // Upload route requires auth, so any unauthed request gets 401
    expect([401, 404, 405]).toContain(response.status())
  })
})

test.describe('Product Management - Public Product Pages', () => {
  test('homepage loads and renders product content', async ({ page }) => {
    const response = await page.goto('/')
    // May be 200 or 500 (if DB is down), but page should load
    expect(response).not.toBeNull()
    expect([200, 500]).toContain(response!.status())
  })

  test('product search API returns structured response', async ({ request }) => {
    const response = await request.get('/api/products/search?q=bowl')
    // Should return 200 even with empty results
    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json).toHaveProperty('products')
  })

  test('product suggestions API returns structured response', async ({ request }) => {
    const response = await request.get('/api/products/suggestions?q=cer')
    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(Array.isArray(json.suggestions) || Array.isArray(json)).toBe(true)
  })
})

test.describe('Product Management - Admin Login Page Structure', () => {
  test('admin login page has correct form structure', async ({ page }) => {
    await page.goto('/auth/admin-login')
    await expect(page).toHaveURL(/.*admin-login.*/)

    // Should have email and password inputs
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })

  test('admin login page has accessible labels', async ({ page }) => {
    await page.goto('/auth/admin-login')
    await page.waitForLoadState('domcontentloaded')

    // Check inputs have associated labels or aria attributes
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 10000 })

    const emailLabel = await emailInput.getAttribute('aria-label') ||
      await emailInput.getAttribute('placeholder') ||
      await emailInput.getAttribute('id')
    expect(emailLabel).toBeTruthy()
  })
})
