import { describe, test, expect } from "vitest";
import { usePlaywright } from "@core/fixtures/playwright.fixture";
import { AuthService, TopicsService } from "@project/services";

describe("模糊检索帖子标题", () => {
  const ctx = usePlaywright();

  test(
    "能模糊搜索到指定标题的帖子",
    { tags: ["@search", "@topics", "@p0"], timeout: 90_000 },
    async () => {
      const username = process.env.TEST_USERNAME;
      const password = process.env.TEST_PASSWORD;

      if (!username || !password) {
        console.warn("⚠️  跳过测试：未配置 TEST_USERNAME / TEST_PASSWORD");
        expect(true).toBe(true);
        return;
      }

      const authService = new AuthService(ctx.page);
      const loginResult = await authService.login(username, password);
      expect(loginResult.success).toBe(true);
      console.log("登陆成功");

      const keyword = "如何用 harness";
      const topicsService = new TopicsService(ctx.page);
      const result = await topicsService.searchFromCommunity(keyword);

      console.log(`搜索「${keyword}」结果：`, result.titles);
      const found = result.titles.some((title) =>
        title.includes("如何用 harness")
      );
      expect(found).toBe(true);
    }
  );
});
