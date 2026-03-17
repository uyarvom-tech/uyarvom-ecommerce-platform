import { test, expect } from '@playwright/test';

test.describe('Customer Checkout Flow', () => {
  test('navigates to product, adds to cart, and reaches checkout', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText(/Uyarvom/i, { timeout: 20000 });
    await page.waitForSelector('article', { timeout: 15000 });
    const productCount = await page.locator('article').count();
    expect(productCount).toBeGreaterThan(0);

    const firstProductCard = page.locator('article').first();
    const productName = await firstProductCard.locator('h3').textContent();

    await Promise.all([
      page.waitForURL(/\/products\/.+/, { timeout: 30000 }),
      firstProductCard.locator('a[href^="/products/"]').first().click(),
    ]);

    if (productName) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        productName.trim().substring(0, 20), { timeout: 15000 }
      );
    }

    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    // Guest user should be redirected to login
    await expect(page).toHaveURL(/.*auth\/login.*/, { timeout: 15000 });
    await expect(page.getByText(/Welcome Back/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Product Browsing', () => {
  test('homepage loads with products', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible({ timeout: 20000 });
    await page.waitForSelector('article', { timeout: 15000 });
    const count = await page.locator('article').count();
    expect(count).toBeGreaterThan(0);
  });

  test('product detail page loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/products/"]', { timeout: 15000 });
    const firstLink = page.locator('a[href^="/products/"]').first();
    await Promise.all([
      page.waitForURL(/\/products\/.+/, { timeout: 30000 }),
      firstLink.click(),
    ]);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('search bar is present on homepage', async ({ page }) => {
    await page.goto('/');
    // Search input or button should be visible in header
    const searchEl = page.locator('input[type="search"], input[placeholder*="search" i], button[aria-label*="search" i]').first();
    await expect(searchEl).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Authentication Pages', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should show an error message, not redirect
    await expect(page.locator('text=/invalid|error|incorrect/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('account page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/.*login.*/, { timeout: 15000 });
  });
});
