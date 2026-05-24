import { describe, test, expect } from "vitest";
import { usePlaywright } from "@core/fixtures/playwright.fixture";
import { AuthService, TopicsService } from "@project/services";

describe("创建新话题", () => {
  const ctx = usePlaywright();

  test(
    "用户可以在发布话题页面填写标题",
    { tags: ["@smoke", "@topics", "@p0"], timeout: 90_000 },
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
      console.log("登录成功");

      const suffix = String(Date.now()).slice(-6);
      const title = `UI自动化标题_${suffix}`;

      const topicsService = new TopicsService(ctx.page);
      const result = await topicsService.publishTopic(title);

      expect(result.success).toBe(true);
      console.log("填写话题标题成功，标题：", title);
    }
  );
});
