import * as fs from "fs";
import * as path from "path";
import { getAuthStatePath } from "../project/paths";

const ALLURE_RESULTS_DIR = path.resolve(process.cwd(), "allure-results");
const FALLBACK_LOG = path.resolve(
  process.cwd(),
  "test-results",
  "fallback-events.log"
);

function cleanAllureResults() {
  if (!fs.existsSync(ALLURE_RESULTS_DIR)) return;
  for (const entry of fs.readdirSync(ALLURE_RESULTS_DIR)) {
    fs.rmSync(path.join(ALLURE_RESULTS_DIR, entry), {
      recursive: true,
      force: true,
    });
  }
  console.log("[globalSetup] 已清空 allure-results/");
}

function cleanFallbackLog() {
  if (fs.existsSync(FALLBACK_LOG)) {
    fs.rmSync(FALLBACK_LOG, { force: true });
    console.log("[globalSetup] 已清空 fallback-events.log");
  }
}

export async function setup() {
  const project = process.env.PROJECT || "testerhome";
  console.log(`[globalSetup] 当前项目: ${project}`);

  cleanAllureResults();
  cleanFallbackLog();

  const authFile = getAuthStatePath();
  if (fs.existsSync(authFile)) {
    const data = JSON.parse(fs.readFileSync(authFile, "utf-8"));
    const cookies = data.cookies || [];

    if (cookies.length === 0) {
      console.warn(
        `[globalSetup] ${authFile} 中没有 Cookie，请重新运行 npm run auth`
      );
    } else {
      console.log(
        `[globalSetup] 已找到认证文件，共 ${cookies.length} 条 Cookie`
      );
    }
  } else {
    console.log(
      `[globalSetup] 未找到 ${authFile}，需要登录态的测试将以未登录状态运行`
    );
    console.log("[globalSetup] 如需登录态，请运行: npm run auth");
  }
}

export async function teardown() {}
