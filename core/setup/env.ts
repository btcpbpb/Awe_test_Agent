import * as dotenv from "dotenv";
import * as path from "path";
import {
  getAiConfig,
  getMissingMidsceneKeys,
  isMidsceneRuntime,
} from "../config/ai-config";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const config = getAiConfig();

if (isMidsceneRuntime()) {
  const missing = getMissingMidsceneKeys();
  if (missing.length > 0) {
    throw new Error(
      `[setup/env] AI_RUNTIME=midscene，缺少 Midscene 环境变量: ${missing.join(", ")}\n` +
        `请配置 .env（参照 .env.example），或设置 AI_RUNTIME=playwright 跳过 AI 定位。\n` +
        `当前编排模式: AI_ORCHESTRATOR=${config.orchestrator}`
    );
  }
} else {
  console.log(
    `[setup/env] AI_RUNTIME=playwright，跳过 Midscene 校验（编排: ${config.orchestrator}）`
  );
}
