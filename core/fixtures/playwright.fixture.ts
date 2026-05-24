import { beforeEach, afterEach } from "vitest";
import type { TestContext } from "vitest";
import type { BrowserContext, Page } from "playwright";
import * as fs from "fs";
import { createBrowser } from "../browser/createBrowser";
import { getAuthStatePath } from "../project/paths";
import { screenshotOnFailure } from "./screenshot-on-failure";

export interface PlaywrightContext {
  context: BrowserContext;
  page: Page;
}

async function setupBrowserAndPage(
  ctx: Partial<PlaywrightContext>,
  options?: { headless?: boolean }
): Promise<void> {
  const isHeadless = options?.headless ?? process.env.HEADLESS === "true";
  const created = await createBrowser({ headless: isHeadless });
  const pages = created.context.pages();
  const pg = pages.length > 0 ? pages[0] : await created.context.newPage();
  pg.setDefaultTimeout(30_000);
  ctx.context = created.context;
  ctx.page = pg;
}

async function teardownBrowser(
  ctx: Partial<PlaywrightContext>,
  task: TestContext["task"]
): Promise<void> {
  await screenshotOnFailure(ctx.page, task);
  try {
    await ctx.context?.close();
  } catch (err) {
    console.warn(
      "[fixture] context.close() 失败:",
      err instanceof Error ? err.message : err
    );
  }
}

export function usePlaywright(options?: { headless?: boolean }): PlaywrightContext {
  const ctx: Partial<PlaywrightContext> = {};

  beforeEach(async () => {
    await setupBrowserAndPage(ctx, options);
  });

  afterEach(async (taskCtx) => {
    await teardownBrowser(ctx, taskCtx.task);
  });

  return ctx as PlaywrightContext;
}

export function usePlaywrightWithAuth(targetUrl?: string): PlaywrightContext {
  const ctx: Partial<PlaywrightContext> = {};
  const authFile = getAuthStatePath();
  const resolvedTarget =
    targetUrl ?? (globalThis as { __AWE_BASE_URL__?: string }).__AWE_BASE_URL__ ?? "";

  beforeEach(async () => {
    await setupBrowserAndPage(ctx);

    const pg = ctx.page!;
    const context = ctx.context!;

    if (fs.existsSync(authFile)) {
      const { cookies } = JSON.parse(fs.readFileSync(authFile, "utf-8"));
      await context.addCookies(cookies);
      console.log(`[fixture] 已注入 ${cookies.length} 条 Cookie，跳过登录`);
    } else {
      console.warn(
        `[fixture] 未找到 ${authFile}，将以未登录状态访问页面`
      );
    }

    if (resolvedTarget) {
      await pg.goto(resolvedTarget);
      await pg.waitForLoadState("domcontentloaded");
    }
  }, 60_000);

  afterEach(async (taskCtx) => {
    await teardownBrowser(ctx, taskCtx.task);
  });

  return ctx as PlaywrightContext;
}
