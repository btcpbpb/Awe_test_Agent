/**
 * 验证报告失败分类（Agent 与 report.json 共用）
 */

export type VerificationStatus =
  | "passed"
  | "failed"
  | "architecture_violation"
  | "ai_only_violation";

/** 单条用例 / 步骤级失败分类 */
export type FailureClass =
  | "passed"
  | "healed"
  | "locator_drift"
  | "selector_not_found"
  | "timeout"
  | "assertion_failed"
  | "environment_failed"
  | "logic_error"
  | "type_error"
  | "import_error"
  | "architecture_violation"
  | "ai_only_violation"
  | "unknown";

export interface CaseResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  failureClass: FailureClass;
  durationMs?: number;
  errorMessage?: string;
  screenshotPath?: string;
  repairSuggestion?: string;
}

export interface VerificationReport {
  version: 1;
  generatedAt: string;
  project: string;
  status: VerificationStatus;
  testFile?: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationMs?: number;
  };
  cases: CaseResult[];
  architectureViolations?: Array<{
    file: string;
    line?: number;
    code?: string;
    issue: string;
  }>;
  artifacts: {
    logPath: string;
    reportJsonPath: string;
    reportMdPath: string;
    fallbackLogPath?: string;
    verificationArtifactPath?: string;
  };
  agentHints: {
    readFirst: string;
    readOnFailure: string[];
    readLastResort: string[];
    tokenRule: string;
  };
}

export function classifyFailure(errorText: string): FailureClass {
  const text = (errorText || "").toLowerCase();

  if (!text.trim()) return "unknown";

  if (
    text.includes("element not found") ||
    text.includes("no element") ||
    text.includes("queryselector returned null") ||
    text.includes("locator resolved to 0") ||
    text.includes("waiting for selector") ||
    text.includes("ai-only 失败") ||
    text.includes("ai 兜底也失败")
  ) {
    return "selector_not_found";
  }

  if (
    text.includes("midscene") &&
    (text.includes("缺少") || text.includes("missing"))
  ) {
    return "environment_failed";
  }

  if (
    text.includes("test_username") ||
    text.includes("未配置") ||
    text.includes("enotfound") ||
    text.includes("network") ||
    text.includes("econnrefused") ||
    text.includes("navigation") ||
    text.includes("net::")
  ) {
    return "environment_failed";
  }

  if (
    text.includes("timeout") ||
    text.includes("exceeded") ||
    text.includes("timed out")
  ) {
    return "timeout";
  }

  if (
    text.includes("assertionerror") ||
    text.includes("expect(") ||
    text.includes("expected") ||
    text.includes("tobe(") ||
    text.includes("断言")
  ) {
    return "assertion_failed";
  }

  if (
    text.includes("cannot find module") ||
    text.includes("module not found") ||
    text.includes("import")
  ) {
    return "import_error";
  }

  if (
    text.includes("typeerror") ||
    text.includes("ts") ||
    text.includes("类型")
  ) {
    return "type_error";
  }

  return "logic_error";
}

export function repairSuggestionFor(failureClass: FailureClass): string {
  switch (failureClass) {
    case "selector_not_found":
    case "locator_drift":
      return "优化 Page/Component 的 AI 描述或 withFallback cssAction；参考 fallback-events.log";
    case "timeout":
      return "增加 wait 或检查页面是否被遮挡/未加载完成";
    case "assertion_failed":
      return "对照截图确认实际页面状态，调整 expect 或前置步骤";
    case "environment_failed":
      return "检查 .env、网络、登录态（npm run auth）及 Midscene 配置";
    case "import_error":
      return "修正 @core / @project 导入路径";
    case "type_error":
      return "修正 TypeScript 类型定义";
    case "architecture_violation":
      return "将 DOM/AI 操作移到 Page 或 Component 层";
    case "ai_only_violation":
      return "首轮 Page 方法使用 aiOnly: true 且 cssAction: async () => false";
    default:
      return "阅读 report.json 与 latest-run.log 定位根因";
  }
}
