import { expect, test } from "@playwright/test";

test("primary routes and More destinations are reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome home" })).toBeVisible();

  for (const [name, url] of [["Schedule", "/schedule"], ["Family Hub", "/family-hub"], ["My Day", "/my-day"], ["More", "/more"]] as const) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
  }

  await page.locator('a[href="/meals"]').click();
  await expect(page).toHaveURL("/meals");
  await expect(page.getByRole("heading", { name: "Meals", level: 1 })).toBeVisible();
});

test("mobile routes do not overflow horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/my-day");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
});

test("all family rooms reflow without console errors", async ({ page }) => {
  test.setTimeout(240_000);
  const routes = [
    "/",
    "/schedule",
    "/family-hub",
    "/my-day",
    "/more",
    "/meals",
    "/shopping",
    "/household",
    "/pets",
    "/contacts",
    "/vehicles",
    "/documents",
    "/finance",
    "/settings",
  ];
  const viewports = [
    { width: 1440, height: 1000 },
    { width: 1280, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ];
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(dimensions.viewport);
    }
  }

  expect(errors).toEqual([]);
});

test("primary navigation and task controls work from the keyboard", async ({ page }) => {
  await page.goto("/");
  const scheduleLink = page.getByRole("link", { name: "Schedule", exact: true });
  await scheduleLink.focus();
  await scheduleLink.press("Enter");
  await expect(page).toHaveURL("/schedule");

  await page.goto("/my-day");
  const taskButton = page.getByRole("button", { name: /Make bed/ });
  await taskButton.focus();
  await taskButton.press("Space");
  await expect(taskButton).toHaveAttribute("aria-pressed", "true");
  await taskButton.press("Space");
  await expect(taskButton).toHaveAttribute("aria-pressed", "false");
});

test("sign-out control reaches the accessible sign-in screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in to your family home" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
