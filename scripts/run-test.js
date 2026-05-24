#!/usr/bin/env node
/**
 * npm test 的编排器
 *
 *   1. 执行 vitest run，日志写入 test-results/latest-run.log
 *   2. 生成 test-results/verification/report.json + report.md
 *   3. 生成 Allure HTML 报告
 *   4. 退出码 = vitest 退出码
 */

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const args = process.argv.slice(2);

const logDir = path.join(ROOT, "test-results");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 1. 跑 vitest（捕获日志）
const vitest = spawnSync("npx", ["vitest", "run", ...args], {
  cwd: ROOT,
  shell: process.platform === "win32",
  encoding: "utf-8",
});

const output = `${vitest.stdout || ""}${vitest.stderr || ""}`;
if (vitest.stdout) process.stdout.write(vitest.stdout);
if (vitest.stderr) process.stderr.write(vitest.stderr);

const logPath = path.join(logDir, "latest-run.log");
fs.writeFileSync(logPath, output, "utf-8");

// 推断单文件测试路径（verifier / report 用）
let testFile;
const fileArg = args.find(
  (a) => a.endsWith(".test.ts") && !a.startsWith("-")
);
if (fileArg) {
  testFile = fileArg.replace(/\\/g, "/");
}

// 2. 生成结构化验证报告
console.log("\n[test-runner] 生成 verification report …");
const reportBuild = spawnSync(
  "npx",
  [
    "tsx",
    "scripts/build-verification-report.ts",
    "--exit-code",
    String(vitest.status ?? 1),
    ...(testFile ? ["--test-file", testFile] : []),
  ],
  { cwd: ROOT, shell: process.platform === "win32", encoding: "utf-8" }
);
if (reportBuild.stdout) process.stdout.write(reportBuild.stdout);
if (reportBuild.stderr) process.stderr.write(reportBuild.stderr);

// 3. 生成 allure 报告
console.log("\n[test-runner] 生成 allure 报告 …");
const gen = spawnSync(
  "npx",
  [
    "allure-commandline",
    "generate",
    "allure-results",
    "-o",
    "allure-report",
    "--clean",
  ],
  { stdio: "inherit", cwd: ROOT, shell: process.platform === "win32" }
);

if (gen.status !== 0) {
  console.warn(
    "[test-runner] allure 报告生成失败（非致命），请检查 allure-results 目录"
  );
}

// 4. 可选启动 allure 服务
if (process.env.ALLURE_SERVE === "1") {
  console.log("[test-runner] 启动 allure 服务 …");
  const server = spawn("node", [path.join("scripts", "allure-report.js")], {
    stdio: "inherit",
    cwd: ROOT,
  });
  server.on("exit", () => process.exit(vitest.status ?? 0));
  return;
}

process.exit(vitest.status ?? 0);
