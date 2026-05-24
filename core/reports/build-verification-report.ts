import * as fs from "fs";
import * as path from "path";
import type {
  CaseResult,
  FailureClass,
  VerificationReport,
  VerificationStatus,
} from "./verification-types";
import {
  classifyFailure,
  repairSuggestionFor,
} from "./verification-types";

const ROOT = process.cwd();

function findLatestScreenshot(): string | undefined {
  const dir = path.join(ROOT, "test-results", "screenshots");
  if (!fs.existsSync(dir)) return undefined;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  if (files.length === 0) return undefined;
  return path.join("test-results", "screenshots", files[0].name);
}

interface ParsedVitestCase {
  name: string;
  status: "passed" | "failed" | "skipped";
  durationMs?: number;
  errorBlock?: string;
}

/** 从 vitest verbose 输出解析用例结果 */
export function parseVitestLog(log: string): ParsedVitestCase[] {
  const cases: ParsedVitestCase[] = [];
  const lines = log.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const passMatch = line.match(/✓\s+(.+?)\s+\((\d+)\s*ms\)/);
    if (passMatch) {
      cases.push({
        name: passMatch[1].trim(),
        status: "passed",
        durationMs: passMatch[2] ? Number(passMatch[2]) : undefined,
      });
      continue;
    }

    const failMatch = line.match(/×\s+(.+?)(?:\s+\((\d+)\s*ms\))?/);
    if (failMatch) {
      const errorLines: string[] = [];
      for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
        const next = lines[j];
        if (next.match(/✓\s+/) || next.match(/×\s+/) || next.match(/^Tests\s+/)) {
          break;
        }
        if (next.trim()) errorLines.push(next);
      }
      cases.push({
        name: failMatch[1].trim(),
        status: "failed",
        durationMs: failMatch[2] ? Number(failMatch[2]) : undefined,
        errorBlock: errorLines.join("\n"),
      });
    }
  }

  return cases;
}

export interface BuildReportOptions {
  project?: string;
  testFile?: string;
  logPath?: string;
  exitCode?: number;
  statusOverride?: VerificationStatus;
}

export function buildVerificationReport(
  options: BuildReportOptions = {}
): VerificationReport {
  const project = options.project || process.env.PROJECT || "testerhome";
  const logPath =
    options.logPath || path.join("test-results", "latest-run.log");
  const absLog = path.join(ROOT, logPath);

  let log = "";
  if (fs.existsSync(absLog)) {
    log = fs.readFileSync(absLog, "utf-8");
  }

  const parsed = parseVitestLog(log);
  const screenshot = findLatestScreenshot();
  const fallbackLog = path.join("test-results", "fallback-events.log");

  const cases: CaseResult[] = parsed.map((c) => {
    const failureClass: FailureClass =
      c.status === "passed"
        ? "passed"
        : classifyFailure(c.errorBlock || log);
    return {
      name: c.name,
      status: c.status,
      durationMs: c.durationMs,
      failureClass,
      errorMessage: c.errorBlock?.slice(0, 2000),
      screenshotPath: c.status === "failed" ? screenshot : undefined,
      repairSuggestion:
        c.status === "failed"
          ? repairSuggestionFor(failureClass)
          : undefined,
    };
  });

  const passed = cases.filter((c) => c.status === "passed").length;
  const failed = cases.filter((c) => c.status === "failed").length;
  const skipped = cases.filter((c) => c.status === "skipped").length;
  const total = cases.length;

  let status: VerificationStatus = "passed";
  if (options.statusOverride) {
    status = options.statusOverride;
  } else if (failed > 0 || (options.exitCode ?? 0) !== 0) {
    status = "failed";
  }

  if (total === 0 && (options.exitCode ?? 0) !== 0) {
    cases.push({
      name: "(suite)",
      status: "failed",
      failureClass: classifyFailure(log),
      errorMessage: log.slice(-3000),
      screenshotPath: screenshot,
      repairSuggestion: repairSuggestionFor(classifyFailure(log)),
    });
  }

  const outDir = path.join(ROOT, "test-results", "verification");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const reportJsonPath = path.join("test-results", "verification", "report.json");
  const reportMdPath = path.join("test-results", "verification", "report.md");
  const artifactCopy = path.join(
    "skills/ui-automation/artifacts",
    "_verification.json"
  );

  const report: VerificationReport = {
    version: 1,
    generatedAt: new Date().toISOString(),
    project,
    status,
    testFile: options.testFile,
    summary: {
      total: Math.max(total, cases.length),
      passed,
      failed,
      skipped,
    },
    cases,
    artifacts: {
      logPath,
      reportJsonPath,
      reportMdPath,
      fallbackLogPath: fs.existsSync(path.join(ROOT, fallbackLog))
        ? fallbackLog
        : undefined,
      verificationArtifactPath: artifactCopy,
    },
    agentHints: {
      readFirst: reportJsonPath,
      readOnFailure: [reportJsonPath, logPath],
      readLastResort: screenshot
        ? [screenshot, "allure-report/index.html"]
        : ["allure-report/index.html"],
      tokenRule:
        "通过只读 report.md；失败先读 report.json，再读 log；截图/trace 最后手段",
    },
  };

  if (status === "passed" && failed === 0 && (options.exitCode ?? 0) === 0) {
    report.status = "passed";
    report.summary.failed = 0;
  }

  return report;
}

export function writeVerificationReport(report: VerificationReport): void {
  const jsonPath = path.join(ROOT, report.artifacts.reportJsonPath);
  const mdPath = path.join(ROOT, report.artifacts.reportMdPath);
  const artifactDir = path.join(ROOT, "skills/ui-automation/artifacts");

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");

  const md = renderReportMd(report);
  fs.writeFileSync(mdPath, md, "utf-8");

  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(artifactDir, "_verification.json"),
    JSON.stringify(report, null, 2),
    "utf-8"
  );

  console.log(`[verification] report.json → ${report.artifacts.reportJsonPath}`);
  console.log(`[verification] report.md   → ${report.artifacts.reportMdPath}`);
}

function renderReportMd(report: VerificationReport): string {
  const lines: string[] = [
    `# 验证报告`,
    ``,
    `- 状态：**${report.status}**`,
    `- 项目：${report.project}`,
    `- 生成时间：${report.generatedAt}`,
  ];

  if (report.testFile) {
    lines.push(`- 测试文件：${report.testFile}`);
  }

  lines.push(
    ``,
    `## 摘要`,
    ``,
    `| 指标 | 数量 |`,
    `|------|------|`,
    `| 总计 | ${report.summary.total} |`,
    `| 通过 | ${report.summary.passed} |`,
    `| 失败 | ${report.summary.failed} |`,
    `| 跳过 | ${report.summary.skipped} |`,
    ``
  );

  if (report.cases.length > 0) {
    lines.push(`## 用例`, ``);
    for (const c of report.cases) {
      const icon =
        c.status === "passed" ? "✅" : c.status === "skipped" ? "⏭️" : "❌";
      lines.push(
        `- ${icon} **${c.name}** — \`${c.failureClass}\`${c.durationMs ? ` (${c.durationMs}ms)` : ""}`
      );
      if (c.repairSuggestion && c.status === "failed") {
        lines.push(`  - 修复建议：${c.repairSuggestion}`);
      }
    }
    lines.push(``);
  }

  lines.push(
    `## Agent 阅读顺序`,
    ``,
    `1. ${report.agentHints.readFirst}`,
    `2. 失败时：${report.agentHints.readOnFailure.join(" → ")}`,
    `3. 最后手段：${report.agentHints.readLastResort.join(" → ")}`,
    ``
  );

  return lines.join("\n");
}
