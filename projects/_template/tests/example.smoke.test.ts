import { describe, test, expect } from "vitest";
import { usePlaywright } from "@core/fixtures/playwright.fixture";
import { BASE_URL } from "@project/urls";

describe("示例冒烟测试", () => {
  const ctx = usePlaywright();

  test("首页可访问", { tags: ["@smoke", "@p0"], timeout: 60_000 }, async () => {
    await ctx.page.goto(BASE_URL);
    await ctx.page.waitForLoadState("domcontentloaded");
    expect(ctx.page.url()).toContain(new URL(BASE_URL).hostname);
  });
});
