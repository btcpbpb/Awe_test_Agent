#!/usr/bin/env node
/**
 * 检查本地开发环境是否就绪（不运行测试）
 *
 * 用法：npm run check:env
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const envPath = path.join(ROOT, ".env");

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = val;
  });
}

const PROJECT = process.env.PROJECT || "testerhome";
const ORCHESTRATOR = (process.env.AI_ORCHESTRATOR || "cursor").toLowerCase();
const RUNTIME = (process.env.AI_RUNTIME || "midscene").toLowerCase();

const MIDSCENE_KEYS = [
  "MIDSCENE_MODEL_BASE_URL",
  "MIDSCENE_MODEL_API_KEY",
  "MIDSCENE_MODEL_NAME",
];

let ok = true;

function pass(msg) {
  console.log(`✅ ${msg}`);
}

function fail(msg) {
  console.log(`❌ ${msg}`);
  ok = false;
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

console.log("\n=== Awe_test_Agent 环境检查 ===\n");
console.log(`项目: ${PROJECT}`);
info(`AI_ORCHESTRATOR=${ORCHESTRATOR}（编排层）`);
info(`AI_RUNTIME=${RUNTIME}（浏览器运行时）`);

if (fs.existsSync(envPath)) {
  pass(`.env 存在`);
} else {
  warn(`.env 不存在（Cursor IDE 编排可不建；跑 Midscene 测试需 cp .env.example .env）`);
}

if (ORCHESTRATOR === "cursor") {
  pass("编排层: Cursor 智能体（默认）");
  info("在 Cursor IDE 中对话即可，无需 CURSOR_API_KEY");
  if (!process.env.CURSOR_API_KEY) {
    info("CLI 跑 npm run agent 时需配置 CURSOR_API_KEY");
  } else {
    pass("CURSOR_API_KEY 已配置（CLI Agent 可用）");
  }
} else {
  info("编排层: manual（人工 / 直接改代码）");
}

if (RUNTIME === "midscene") {
  const missing = MIDSCENE_KEYS.filter((k) => !process.env[k]);
  if (missing.length === 0) {
    pass("Midscene 运行时变量已配置");
  } else if (fs.existsSync(envPath)) {
    fail(`AI_RUNTIME=midscene，缺少: ${missing.join(", ")}`);
  } else {
    fail(`跑测试需 Midscene 配置，或设 AI_RUNTIME=playwright`);
  }
} else {
  pass("AI_RUNTIME=playwright，无需 Midscene 变量");
}

const projectDir = path.join(ROOT, "projects", PROJECT);
if (fs.existsSync(projectDir)) {
  pass(`项目目录: projects/${PROJECT}/`);
} else {
  fail(`项目目录不存在: projects/${PROJECT}/`);
}

const testDir = path.join(projectDir, "tests");
if (fs.existsSync(testDir)) {
  const count = fs
    .readdirSync(testDir, { recursive: true })
    .filter((f) => String(f).endsWith(".test.ts")).length;
  pass(`发现 ${count} 个测试文件`);
} else {
  fail(`测试目录不存在`);
}

try {
  require.resolve("playwright");
  pass("playwright 已安装");
} catch {
  fail("playwright 未安装");
}

console.log("\n推荐工作流:");
if (ORCHESTRATOR === "cursor") {
  console.log("  • Cursor IDE：直接描述测试需求 → 智能体流水线");
  console.log("  • CLI：npm run agent -- \"你的需求\"");
}
if (RUNTIME === "midscene") {
  console.log("  • 执行测试：npm run test:smoke");
}
console.log("");

process.exit(ok ? 0 : 1);
