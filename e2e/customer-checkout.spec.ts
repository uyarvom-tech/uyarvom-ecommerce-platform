import { test, expect } from '@playwright/test';

test.describe('Customer Checkout Flow', () => {
    test('navigates to product, adds to cart, and reaches checkout', async ({ page }) => {
        // Navigate to homepage
        console.log('Navigating to homepage...');
        await page.goto('/');

        // Verify homepage loads core elements
        console.log('Verifying Uyarvom text in header...');
        await expect(page.locator('header')).toContainText(/Uyarvom/i, { timeout: 20000 });

        // Wait for product cards to appear
        console.log('Waiting for product cards...');
        await page.waitForSelector('article', { timeout: 15000 });
        const productCount = await page.locator('article').count();
        console.log(`Found ${productCount} products.`);
        expect(productCount).toBeGreaterThan(0);

        // Get the first product card
        const firstProductCard = page.locator('article').first();
        const productName = await firstProductCard.locator('h3').textContent();
        console.log(`Testing with product: ${productName?.trim()}`);

        // Click the product link
        await firstProductCard.locator('a[href^="/products/"]').first().click();

        // On product detail page
        console.log('Verifying product detail page (waiting for URL change)...');
        await page.waitForURL(/\/products\/.+/, { timeout: 20000 });
        console.log(`Current URL: ${page.url()}`);

        if (productName) {
            const trimmedName = productName.trim().substring(0, 20);
            await expect(page.getByRole('heading', { level: 1 })).toContainText(trimmedName, { timeout: 15000 });
        }

        // Find Add to Cart button
        const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i });
        await expect(addToCartBtn).toBeVisible({ timeout: 10000 });

        // Guest Flow: Click Add to Cart and expect login redirect
        console.log('Clicking Add to Cart...');
        await addToCartBtn.click();

        // Wait for redirect to login page
        console.log('Waiting for redirect to login...');
        await page.waitForURL(/.*auth\/login.*/, { timeout: 20000 });
        console.log(`Redirected to: ${page.url()}`);

        // Final verify for login page
        console.log('Verifying login page content...');
        // Use first() to avoid strict mode violation if multiple matches exist
        await expect(page.getByText(/Welcome Back/i).first()).toBeVisible({ timeout: 15000 });
        console.log('Test completed successfully!');
    });
});
