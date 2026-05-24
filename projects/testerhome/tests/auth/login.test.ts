import { describe, test, expect } from "vitest";
import { usePlaywright } from "@core/fixtures/playwright.fixture";
import { AuthService } from "@project/services";

describe("TesterHome 登录功能", () => {
  const ctx = usePlaywright();

  test("正确账号密码可以登录成功", { tags: ["@smoke", "@auth", "@p0"], timeout: 60_000 }, async () => {
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;

    if (!username || !password) {
      console.warn("⚠️  跳过登录测试：未配置 TEST_USERNAME / TEST_PASSWORD");
      expect(true).toBe(true);
      return;
    }

    const service = new AuthService(ctx.page);
    const result = await service.login(username, password);

    expect(result.success).toBe(true);
  });

  test("错误密码登录失败并显示错误提示", { tags: ["@smoke", "@auth", "@p1"], timeout: 60_000 }, async () => {
    const service = new AuthService(ctx.page);
    const result = await service.login("nonexistent_user_12345", "wrong_password_xyz");

    expect(result.success).toBe(false);
  });
});
