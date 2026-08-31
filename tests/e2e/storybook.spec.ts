import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Tap into a talking world.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore the World/i })).toBeVisible();
});

test('eggs page loads and egg can hatch', async ({ page }) => {
  await page.goto('/eggs');
  await page.getByRole('button', { name: /chicken egg/i }).click();
  await expect(page.getByRole('heading', { name: 'Pip the Chick' })).toBeVisible();
});

test('jungle page loads and entity can be selected', async ({ page }) => {
  await page.goto('/jungle');
  await page.getByRole('button', { name: /Flutter the Butterfly/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Flutter the Butterfly' }),
  ).toBeVisible();
});

test('developer panel can validate an out-of-domain redirect', async ({ page }) => {
  await page.goto('/jungle');
  await page.getByRole('button', { name: /Flutter the Butterfly/i }).click();
  await page
    .getByPlaceholder('Type a test question for demo mode')
    .fill('What do sharks eat?');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText(/flutters away from my butterfly world/i)).toBeVisible();
});

test('globe country picker opens and closes an existing conversation popup', async ({ page }) => {
  await page.goto('/globe');
  await expect(page.getByRole('heading', { name: 'Explore the World' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rotate globe left' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rotate globe right' })).toBeVisible();

  await page.getByLabel('Choose a country to explore').selectOption('IN');
  await expect(page.getByRole('heading', { name: 'Explore India' })).toBeVisible();
  await page.getByRole('button', { name: 'Close conversation' }).click();

  await expect(page.getByRole('heading', { name: 'Explore the World' })).toBeVisible();
  await expect(page.getByText(/1 \/ \d+ guides visited/)).toBeVisible();
});

test('real map polygon selects its country and dragging does not open a popup', async ({ page }) => {
  await page.goto('/globe');
  await page.getByRole('button', { name: 'Pause globe rotation' }).click();
  await page.getByLabel('Choose a country to explore').selectOption('FR');
  await expect(page.getByRole('heading', { name: 'Explore France' })).toBeVisible();
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: 'Close conversation' }).click();

  const globe = page.getByRole('application', { name: /interactive world globe/i });
  const bounds = await globe.boundingBox();
  if (!bounds) throw new Error('Globe bounds were unavailable');

  await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
  await expect(page.getByRole('heading', { name: 'Explore France' })).toBeVisible();
  await page.getByRole('button', { name: 'Close conversation' }).click();

  await page.mouse.move(bounds.x + bounds.width * 0.55, bounds.y + bounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.35, bounds.y + bounds.height * 0.5, {
    steps: 8,
  });
  await page.mouse.up();

  await expect(page.getByRole('button', { name: 'Close conversation' })).toHaveCount(0);
});

for (const device of [
  { name: 'desktop 1920x1080', width: 1920, height: 1080 },
  { name: 'desktop 1440x900', width: 1440, height: 900 },
  { name: 'desktop 1366x768', width: 1366, height: 768 },
  { name: 'tablet 1180x820', width: 1180, height: 820 },
  { name: 'tablet 1024x768', width: 1024, height: 768 },
  { name: 'tablet 820x1180', width: 820, height: 1180 },
  { name: 'mobile portrait 430x932', width: 430, height: 932 },
  { name: 'mobile portrait 390x844', width: 390, height: 844 },
  { name: 'mobile portrait 360x800', width: 360, height: 800 },
  { name: 'mobile landscape 932x430', width: 932, height: 430 },
  { name: 'mobile landscape 844x390', width: 844, height: 390 },
]) {
  test(`globe remains usable on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto('/globe');

    await expect(page.getByRole('heading', { name: 'Explore the World' })).toBeVisible();
    await expect(page.getByLabel('Choose a country to explore')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rotate globe left' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rotate globe right' })).toBeVisible();
  });
}

test('non-featured countries open a generated conversational guide', async ({ page }) => {
  await page.goto('/globe');
  await page.getByLabel('Choose a country to explore').selectOption('CN');
  await expect(page.getByRole('heading', { name: 'Explore China' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close conversation' })).toBeVisible();
});

test('orientation changes preserve the active country conversation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/globe');
  await page.getByLabel('Choose a country to explore').selectOption('JP');
  await expect(page.getByRole('heading', { name: 'Explore Japan' })).toBeVisible();

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('heading', { name: 'Explore Japan' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Explore Japan' })).toBeVisible();

  await page.getByRole('button', { name: 'Close conversation' }).click();
  await expect(page.getByText('1 / 8 guides visited')).toBeVisible();
});
