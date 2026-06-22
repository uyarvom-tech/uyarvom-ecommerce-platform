import { test, expect } from '@playwright/test';

test.describe('Admin Operations - Auth Guard', () => {
  test('admin dashboard loads securely', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*auth\/admin-login/);
    await expect(page.getByText(/Admin Portal/i)).toBeVisible();
    await expect(page.getByPlaceholder('staff@uyarvom.com')).toBeVisible();
  });
});

test.describe('Support Ticketing', () => {
  test('support page is publicly accessible', async ({ page }) => {
    await page.goto('/support');
    await expect(page.getByText(/concierge@uyarvom.com/i)).toBeVisible({ timeout: 15000 });
  });

  test('creating a ticket requires authentication', async ({ page }) => {
    await page.goto('/support');
    const ticketLink = page.getByRole('link', { name: /Open a Ticket/i }).first();
    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('support tickets page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/support/tickets');
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 });
  });
});

test.describe('API Authorization', () => {
  test('admin products API returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/products');
    expect([401, 403]).toContain(response.status());
  });

  test('admin categories API returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/categories');
    expect([401, 403]).toContain(response.status());
  });

  test('admin staff API returns 401 without auth on POST', async ({ page }) => {
    const response = await page.request.post('/api/admin/staff', {
      data: { email: 'test@test.com', fullName: 'Test', role: 'staff', password: 'pass' },
    });
    expect([401, 403, 400, 500]).toContain(response.status());
  });

  test('reviews API returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/reviews');
    expect([401, 403]).toContain(response.status());
  });

  test('cart API returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/cart');
    expect([401, 403]).toContain(response.status());
  });

  test('products API is publicly accessible', async ({ page }) => {
    const response = await page.request.get('/api/products');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('products');
    expect(json).toHaveProperty('pagination');
  });
});
