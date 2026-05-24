#!/usr/bin/env node
/**
 * 通过 Cursor SDK 运行 UI 自动化 Agent 流水线（非 IDE 场景）
 *
 * 用法：
 *   npm run agent -- "为 TesterHome 添加 xxx 测试"
 *
 * 需要：
 *   - AI_ORCHESTRATOR=cursor（默认）
 *   - CURSOR_API_KEY
 *   - @cursor/sdk（devDependency）
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

const userRequest = process.argv.slice(2).join(" ").trim();
const orchestrator = (process.env.AI_ORCHESTRATOR || "cursor").toLowerCase();
const project = process.env.PROJECT || "testerhome";

async function main() {
  if (!userRequest) {
    console.error(`
用法: npm run agent -- "你的测试需求描述"

示例:
  npm run agent -- "为 TesterHome 话题模块添加按索引打开的冒烟测试"

环境:
  AI_ORCHESTRATOR=cursor（默认）
  CURSOR_API_KEY=...（必填）
  CURSOR_AGENT_MODEL=composer-2.5（可选）
`);
    process.exit(1);
  }

  if (orchestrator !== "cursor") {
    console.error(
      `[agent] AI_ORCHESTRATOR=${orchestrator}，CLI Agent 仅支持 cursor 模式。\n` +
        `手动模式请直接在 Cursor IDE 中编辑代码，或设置 AI_ORCHESTRATOR=cursor。`
    );
    process.exit(1);
  }

  if (!process.env.CURSOR_API_KEY) {
    console.error(
      "[agent] 缺少 CURSOR_API_KEY。\n" +
        "在 Cursor IDE 中对话即可使用内置智能体；CLI 场景需在 .env 配置 API Key。"
    );
    process.exit(1);
  }

  let Agent;
  try {
    ({ Agent } = await import("@cursor/sdk"));
  } catch {
    console.error(
      "[agent] 未安装 @cursor/sdk。请运行: npm install\n" +
        "或在 Cursor IDE 中直接描述需求（推荐，无需 SDK）。"
    );
    process.exit(1);
  }

  const skillPath = path.join(ROOT, "skills/ui-automation/SKILL.md");
  const cursorPath = path.join(
    ROOT,
    "skills/ui-automation/cursor-orchestration.md"
  );

  if (!fs.existsSync(skillPath)) {
    console.error(`[agent] 找不到 ${skillPath}`);
    process.exit(1);
  }

  const skill = fs.readFileSync(skillPath, "utf-8");
  const cursorGuide = fs.existsSync(cursorPath)
    ? fs.readFileSync(cursorPath, "utf-8")
    : "";

  const prompt = [
    "你是 Awe_test_Agent 的 UI 自动化流程总控。",
    "严格按下方 Skill 执行完整状态机：analyzer → implementer → verifier → curator。",
    "不要跳过用户确认节点。",
    "",
    "## SKILL.md",
    skill,
    "",
    "## Cursor 编排说明",
    cursorGuide,
    "",
    "---",
    `用户需求：${userRequest}`,
    `项目根目录：${ROOT}`,
    `PROJECT：${project}`,
  ].join("\n");

  console.log(`[agent] 启动 Cursor Agent（model: ${process.env.CURSOR_AGENT_MODEL || "composer-2.5"}）…`);

  const result = await Agent.prompt(prompt, {
    apiKey: process.env.CURSOR_API_KEY,
    model: { id: process.env.CURSOR_AGENT_MODEL || "composer-2.5" },
    local: { cwd: ROOT },
  });

  console.log("\n[agent] 状态:", result.status);
  if (result.result) {
    console.log("\n[agent] 结果:\n", result.result);
  }

  process.exit(result.status === "completed" ? 0 : 1);
}

main().catch((err) => {
  console.error("[agent] 执行失败:", err.message || err);
  process.exit(1);
});
