import type { Page } from "playwright";
import type { TestContext } from "vitest";
import { attachment } from "allure-js-commons";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-results", "screenshots");

export async function screenshotOnFailure(
  page: Page | undefined,
  task: TestContext["task"]
): Promise<void> {
  if (task.result?.state !== "fail" || !page) return;

  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const safeName = (task.name || "unknown")
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "_")
      .slice(0, 80);
    const filename = `${safeName}_${Date.now()}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    const buffer = await page.screenshot({ fullPage: true });
    fs.writeFileSync(filepath, buffer);
    console.log(`📸 失败截图已保存: ${filepath}`);

    await attachment("失败截图", buffer, "image/png");
  } catch (err) {
    console.warn(
      "[screenshot-on-failure] 截图失败:",
      err instanceof Error ? err.message : err
    );
  }
}
