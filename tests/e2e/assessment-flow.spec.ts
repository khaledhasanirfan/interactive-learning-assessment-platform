import { test, expect } from '@playwright/test';

test.describe('Interactive Learning & Assessment Platform E2E Flow', () => {
  test('homepage renders hero, course details, and scenario modules', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Interactive Learning & Assessment Platform');
    await expect(page.getByText('CSE-307: Operating System')).toBeVisible();

    // Verify scenario cards exist
    await expect(page.getByText('Paging Address Translation')).toBeVisible();
    await expect(page.getByText('Disk Scheduling Algorithms')).toBeVisible();
  });

  test('student can navigate dashboard and view course quizzes', async ({ page }) => {
    await page.goto('/student/dashboard');

    await expect(page.locator('h1')).toContainText('Student Portal');
    await expect(page.getByText('CSE-307')).toBeVisible();

    // Verify assigned quizzes are listed
    await expect(page.getByText('Assessment 1: Virtual Memory & Address Translation')).toBeVisible();
    await expect(page.getByText('Interactive Practice: Disk Head Scheduling')).toBeVisible();
  });

  test('interactive practice lab allows testing Paging and Disk scenarios', async ({ page }) => {
    await page.goto('/student/practice');

    await expect(page.locator('h1')).toContainText('Operating Systems Interactive Lab');

    // Check Paging tab
    await expect(page.getByText('Logical Byte Address')).toBeVisible();
    await expect(page.getByText('Address Translation Workspace')).toBeVisible();

    // Switch to Disk tab
    await page.getByRole('button', { name: '2. Disk Scheduling Algorithms' }).click();
    await expect(page.getByText('Magnetic Disk Head Scheduling Simulation')).toBeVisible();
    await expect(page.getByText('Horizontal Cylinder Surface')).toBeVisible();
  });

  test('instructor can access studio, inspect questions, and view analytics', async ({ page }) => {
    await page.goto('/instructor/dashboard');

    await expect(page.locator('h1')).toContainText('Dashboard & Course Overview');
    await expect(page.getByText('Active Students')).toBeVisible();
    await expect(page.getByText('Cohort Average')).toBeVisible();

    // Navigate to Question Banks
    await page.goto('/instructor/banks');
    await expect(page.locator('h1')).toContainText('Question Banks & AI Import');
    await expect(page.getByText('Virtual Memory Paging Purpose')).toBeVisible();
  });
});
