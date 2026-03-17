import { test, expect } from '@playwright/test';

test.describe('Admin Operations', () => {
    // Use a simulated state or login
    test('admin dashboard loads securely', async ({ page }) => {
        // Attempt to hit admin without auth
        await page.goto('/admin');

        // Should redirect to auth/admin-login
        await expect(page).toHaveURL(/.*auth\/admin-login/);

        // Check elements
        await expect(page.getByText(/Admin Portal/i)).toBeVisible();
        await expect(page.getByPlaceholder('staff@uyarvom.com')).toBeVisible();
    });
});

test.describe('Support Ticketing', () => {
    test('support page allows unauthenticated reading but requires login for tickets', async ({ page }) => {
        await page.goto('/support');

        // Should see the FAQ and email options
        await expect(page.getByText(/concierge@uyarvom.com/i)).toBeVisible();

        // Attempting to create ticket usually redirects or shows login block
        const ticketLink = page.getByRole('link', { name: /Open a Ticket/i }).first();
        if (await ticketLink.isVisible()) {
            await ticketLink.click();
            await expect(page).toHaveURL(/.*login/);
        }
    });
});
