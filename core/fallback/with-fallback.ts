import * as fs from "fs";
import * as path from "path";
import { getProjectName } from "../project/paths";

const LOG_DIR = path.resolve(process.cwd(), "test-results");
const LOG_FILE = path.join(LOG_DIR, "fallback-events.log");

export type FallbackEventType =
  | "css_success"
  | "ai_fallback_success"
  | "ai_fallback_failed"
  | "ai_only_success"
  | "ai_only_failed";

export interface FallbackEvent {
  timestamp: string;
  project: string;
  type: FallbackEventType;
  className: string;
  label: string;
  cssError?: string;
  aiError?: string;
  pageUrl?: string;
}

let logStreamReady = false;

function writeEvent(event: FallbackEvent) {
  try {
    if (!logStreamReady) {
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }
      logStreamReady = true;
    }
    fs.appendFileSync(LOG_FILE, JSON.stringify(event) + "\n");
  } catch {
    // 日志写入失败不影响测试流程
  }
}

export interface RunWithFallbackOptions {
  className: string;
  label: string;
  cssAction: () => Promise<boolean>;
  aiFallback: () => Promise<void>;
  getPageUrl?: () => string;
  aiOnly?: boolean;
}

export async function runWithFallback(
  options: RunWithFallbackOptions
): Promise<void> {
  const { className, label, cssAction, aiFallback, getPageUrl, aiOnly } =
    options;
  const pageUrl = safeCall(getPageUrl);
  const project = getProjectName();

  if (aiOnly) {
    console.log(`[${className}] 🤖 AI-only 模式: ${label}`);
    try {
      await aiFallback();
      console.log(`[${className}] 🤖 AI-only 成功: ${label}`);
      writeEvent({
        timestamp: new Date().toISOString(),
        project,
        type: "ai_only_success",
        className,
        label,
        pageUrl,
      });
    } catch (err) {
      const aiError = err instanceof Error ? err.message : String(err);
      console.error(`[${className}] 💥 AI-only 失败: ${label}: ${aiError}`);
      writeEvent({
        timestamp: new Date().toISOString(),
        project,
        type: "ai_only_failed",
        className,
        label,
        aiError,
        pageUrl,
      });
      throw err;
    }
    return;
  }

  let cssError: string | undefined;
  let cssSuccess = false;

  try {
    cssSuccess = await cssAction();
    if (!cssSuccess) cssError = "CSS action returned false";
  } catch (err) {
    cssError = err instanceof Error ? err.message : String(err);
  }

  if (cssSuccess) {
    console.log(`[${className}] ✅ CSS 定位成功: ${label}`);
    writeEvent({
      timestamp: new Date().toISOString(),
      project,
      type: "css_success",
      className,
      label,
      pageUrl,
    });
    return;
  }

  console.warn(
    `[${className}] ⚠️  CSS 定位失败 (${label}): ${cssError}，降级 AI`
  );

  try {
    await aiFallback();
    console.log(`[${className}] 🤖 AI 兜底成功: ${label}`);
    writeEvent({
      timestamp: new Date().toISOString(),
      project,
      type: "ai_fallback_success",
      className,
      label,
      cssError,
      pageUrl,
    });
  } catch (err) {
    const aiError = err instanceof Error ? err.message : String(err);
    console.error(`[${className}] 💥 AI 兜底也失败 (${label}): ${aiError}`);
    writeEvent({
      timestamp: new Date().toISOString(),
      project,
      type: "ai_fallback_failed",
      className,
      label,
      cssError,
      aiError,
      pageUrl,
    });
    throw err;
  }
}

function safeCall<T>(fn?: () => T): T | undefined {
  if (!fn) return undefined;
  try {
    return fn();
  } catch {
    return undefined;
  }
}
