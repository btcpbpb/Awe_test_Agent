/**
 * AI 双模式配置
 *
 * - AI_ORCHESTRATOR：谁负责编排（写用例 / 修复 / 沉淀）— 默认 cursor
 * - AI_RUNTIME：测试执行时浏览器内的 AI 定位引擎 — 默认 midscene
 */

export type AiOrchestrator = "cursor" | "manual";
export type AiRuntime = "midscene" | "playwright";

export interface AiConfig {
  /** 编排层：cursor = Cursor 智能体流水线；manual = 人工 / 外部 CI */
  orchestrator: AiOrchestrator;
  /** 运行时：midscene = Midscene 视觉定位；playwright = 纯 Playwright（无 AI 定位） */
  runtime: AiRuntime;
  project: string;
  cursor: {
    apiKey?: string;
    model: string;
  };
  midscene: {
    baseUrl?: string;
    apiKey?: string;
    modelName?: string;
  };
}

function readOrchestrator(): AiOrchestrator {
  const v = (process.env.AI_ORCHESTRATOR || "cursor").toLowerCase();
  if (v === "manual") return "manual";
  return "cursor";
}

function readRuntime(): AiRuntime {
  const v = (process.env.AI_RUNTIME || "midscene").toLowerCase();
  if (v === "playwright") return "playwright";
  return "midscene";
}

export function getAiConfig(): AiConfig {
  return {
    orchestrator: readOrchestrator(),
    runtime: readRuntime(),
    project: process.env.PROJECT || "testerhome",
    cursor: {
      apiKey: process.env.CURSOR_API_KEY,
      model: process.env.CURSOR_AGENT_MODEL || "composer-2.5",
    },
    midscene: {
      baseUrl: process.env.MIDSCENE_MODEL_BASE_URL,
      apiKey: process.env.MIDSCENE_MODEL_API_KEY,
      modelName: process.env.MIDSCENE_MODEL_NAME,
    },
  };
}

export function isCursorOrchestrator(): boolean {
  return getAiConfig().orchestrator === "cursor";
}

export function isMidsceneRuntime(): boolean {
  return getAiConfig().runtime === "midscene";
}

export function getMidsceneRequiredKeys(): readonly string[] {
  return [
    "MIDSCENE_MODEL_BASE_URL",
    "MIDSCENE_MODEL_API_KEY",
    "MIDSCENE_MODEL_NAME",
  ] as const;
}

export function getMissingMidsceneKeys(): string[] {
  return getMidsceneRequiredKeys().filter((k) => !process.env[k]);
}
