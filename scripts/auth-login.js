/**
 * 半自动登录脚本：获取并保存 Cookie
 *
 * 使用方式：npm run auth
 * 可选：PROJECT=myapp npm run auth
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PROJECT = process.env.PROJECT || "testerhome";
const PROJECT_ROOT = path.join(ROOT, "projects", PROJECT);

const envPath = path.join(ROOT, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  });
}

function normalizeUrl(input, fallback) {
  const value = (input || "").trim();
  if (value && /^https?:\/\//i.test(value)) {
    return value.replace(/\/+$/, "");
  }
  return fallback;
}

let baseUrl = "https://testerhome.com";
let loginUrl = `${baseUrl}/account/sign_in`;

const configPath = path.join(PROJECT_ROOT, "project.config.ts");
if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, "utf-8");
  const baseMatch = content.match(/baseUrl:\s*"([^"]+)"/);
  const loginMatch = content.match(/loginUrl:\s*"([^"]+)"/);
  if (baseMatch) baseUrl = baseMatch[1];
  if (loginMatch) loginUrl = loginMatch[1];
}

baseUrl = normalizeUrl(process.env.BASE_URL, baseUrl);
loginUrl = normalizeUrl(process.env.LOGIN_URL, loginUrl);

const AUTH_STATE_FILE = path.join(PROJECT_ROOT, ".auth-state.json");
const USERNAME = process.env.TEST_USERNAME || "";
const PASSWORD = process.env.TEST_PASSWORD || "";

async function main() {
  console.log(`🚀 项目: ${PROJECT}，打开登录页 ${loginUrl}`);
  const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(loginUrl);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  if (USERNAME && PASSWORD) {
    try {
      await page.fill('input[name="user[login]"]', USERNAME);
      await page.fill('input[name="user[password]"]', PASSWORD);
      console.log(`✅ 已填写用户名: ${USERNAME}`);
    } catch {
      console.log("⚠️  自动填写失败，请手动填写用户名和密码");
    }
  } else {
    console.log("⚠️  未配置 TEST_USERNAME / TEST_PASSWORD，请手动填写");
  }

  console.log("\n👉 请在浏览器中完成登录，脚本会自动检测并保存 Cookie...\n");

  const deadline = Date.now() + 120_000;
  let loggedIn = false;

  while (Date.now() < deadline) {
    await page.waitForTimeout(1000);
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some(
      (c) => c.name === "_homeland_session" && c.value.length > 10
    );

    if (hasAuthCookie) {
      loggedIn = true;
      console.log("✅ 检测到登录成功！");
      await page.waitForTimeout(1500);
      fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify({ cookies }, null, 2));
      console.log(`✅ Cookie 已保存到 ${AUTH_STATE_FILE}`);
      break;
    }
  }

  if (!loggedIn) {
    console.error("❌ 等待超时（2分钟），未检测到登录成功");
  }

  await browser.close();
}

main().catch((err) => {
  console.error("❌ 脚本执行失败:", err.message);
  process.exit(1);
});
