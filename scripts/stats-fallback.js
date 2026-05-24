#!/usr/bin/env node
/**
 * 统计 fallback-events.log 中 CSS vs AI 命中率
 *
 * 用法：npm run stats:fallback
 */

const fs = require("fs");
const path = require("path");

const LOG_FILE = path.resolve(process.cwd(), "test-results", "fallback-events.log");

if (!fs.existsSync(LOG_FILE)) {
  console.log("[stats:fallback] 未找到 fallback-events.log，请先运行测试。");
  process.exit(0);
}

const lines = fs.readFileSync(LOG_FILE, "utf-8").trim().split("\n").filter(Boolean);
const events = lines.map((line) => JSON.parse(line));

const byProject = {};
const byType = {};

for (const event of events) {
  const project = event.project || "unknown";
  byProject[project] = byProject[project] || { total: 0, css: 0, ai: 0, failed: 0 };
  byProject[project].total += 1;

  if (event.type === "css_success") byProject[project].css += 1;
  else if (event.type.endsWith("_success")) byProject[project].ai += 1;
  else if (event.type.endsWith("_failed")) byProject[project].failed += 1;

  byType[event.type] = (byType[event.type] || 0) + 1;
}

console.log("\n=== Fallback 统计 ===\n");
console.log("按项目：");
for (const [project, stats] of Object.entries(byProject)) {
  const cssRate =
    stats.total > 0 ? ((stats.css / stats.total) * 100).toFixed(1) : "0.0";
  console.log(
    `  ${project}: 总计 ${stats.total} | CSS ${stats.css} | AI ${stats.ai} | 失败 ${stats.failed} | CSS 命中率 ${cssRate}%`
  );
}

console.log("\n按事件类型：");
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count}`);
}

console.log("");
