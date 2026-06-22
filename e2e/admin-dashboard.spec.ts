import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Access Control', () => {
  test('redirects to admin login if not authenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*auth\/admin-login.*/, { timeout: 15000 });
    await expect(page.getByText(/Admin Portal/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('admin login form has required fields', async ({ page }) => {
    await page.goto('/auth/admin-login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('admin login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/admin-login');
    await page.fill('input[type="email"]', 'notadmin@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid|error|incorrect|unauthorized/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin products page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 });
  });

  test('admin orders page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 });
  });

  test('admin categories page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 });
  });

  test('admin staff page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/staff');
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 });
  });

  test('admin settings page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 });
  });
});

test.describe('API Health Checks', () => {
  test('ping endpoint returns ok', async ({ page }) => {
    const response = await page.request.get('/api/ping');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('ok');
  });

  test('health endpoint returns status', async ({ page }) => {
    const response = await page.request.get('/api/health');
    // May be 200 or 500 depending on DB, but should return JSON
    const json = await response.json();
    expect(json).toHaveProperty('status');
    expect(json).toHaveProperty('timestamp');
  });
});
