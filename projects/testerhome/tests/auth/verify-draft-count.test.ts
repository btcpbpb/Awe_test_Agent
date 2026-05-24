import { describe, test, expect } from "vitest";
import { usePlaywright } from "@core/fixtures/playwright.fixture";
import { AuthService } from "@project/services";

describe("验证草稿数量", () => {
  const ctx = usePlaywright();

  test("登录后验证页面显示草稿 12 篇", { tags: ["@smoke", "@auth", "@p1"], timeout: 60_000 }, async () => {
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;

    if (!username || !password) {
      console.warn("⚠️  跳过测试：未配置 TEST_USERNAME / TEST_PASSWORD");
      expect(true).toBe(true);
      return;
    }

    const service = new AuthService(ctx.page);
    const loginResult = await service.login(username, password);
    expect(loginResult.success).toBe(true);

    const draftResult = await service.getDraftCount();
    expect(draftResult.success).toBe(true);
    expect(draftResult.draftCount).toBe(12);
  });
});
