# Awe_test_Agent 框架设计

> 日期：2026-05-24  
> 状态：Phase 1–3 已实现（2026-05-24）  
> 基线：`D:\code\th-ui-playwright-demo`（fork 增强）  
> 决策：选项 C — demo 增强版，非从零通用框架

---

## 1. 背景与目标

### 1.1 背景

`th-ui-playwright-demo` 是基于 **Playwright + Midscene + Vitest + Allure** 的 AI UI 自动化教学工程，已验证：

- 四层架构（components → pages → services → tests）
- `withFallback`（CSS 优先 → AI 兜底）定位模式
- 三 Agent 流水线（analyzer → implementer → verifier）自动生成/修复用例
- Midscene `PlaywrightAgent` 视觉驱动 UI 操作

但 demo 存在局限：

| 局限 | 说明 |
|------|------|
| 单项目绑定 | `BASE_URL`、源码、测试全在 `src/`，硬编码 TesterHome |
| Agent 绑定 CodeBuddy | Skill 在 `.codebuddy/` 与 `docs/codex/`，未抽象为通用入口 |
| Curator 未实现 | `2026-05-12-ui-automation-curator-design.md` 仅设计，未落地 |
| 无 CI | 无 GitHub Actions，无法自动化回归 |
| 小瑕疵 | `npm run auth` 缺失、`@playwright/test` 未使用、标签写法不统一 |

### 1.2 目标

将 demo fork 为 **`Awe_test_Agent`**，定位为：

> **可复用的 AI Web UI 测试框架 + TesterHome 示例项目**

核心交付：

1. **框架共享层**（`core/`）：浏览器、fixture、withFallback、Base 类
2. **多项目支持**（`projects/`）：每个被测应用独立目录，通过 `PROJECT` 切换
3. **通用 Agent Skill**（`skills/`）：Cursor / Codex 均可使用的 ui-automation 编排
4. **Curator 落地**：测试通过后自动沉淀 best-practices + 可选 CSS 固化提案
5. **CI 模板**：GitHub Actions smoke 流水线

### 1.3 非目标（YAGNI）

- 不做 Web 管理界面
- 不做多浏览器并行 Grid（Phase 1）
- 不替换 Vitest 为 `@playwright/test`（保留 demo 选型，Phase 2+ 可选双模式）
- 不做通用插件市场

---

## 2. 技术栈（继承 demo）

| 类别 | 选型 | 版本参考 | 作用 |
|------|------|---------|------|
| 语言 | TypeScript | ES2022, CommonJS | 强类型 |
| 浏览器 | playwright | ^1.48.0 | Chromium 驱动 |
| AI 引擎 | @midscene/web | ^1.6.0 | 视觉定位（aiTap/aiInput/aiQuery/aiAssert） |
| 测试运行 | Vitest | ^4.1.2 | describe/test/expect、标签、长超时 |
| 报告 | Allure + Midscene Reporter | allure-vitest ^3.7 | 业务报告 + AI 操作报告 |
| 环境校验 | dotenv + zod | — | Midscene 模型配置必填校验 |
| CI | GitHub Actions | — | headless smoke |

### 2.1 Midscene 集成模式

沿用 demo 的 **Script 模式**（非官方 Fixture 模式）：

```typescript
// core/base/BasePage.ts
import { PlaywrightAgent } from "@midscene/web/playwright";

protected getAgent(): PlaywrightAgent {
  if (!this._agent) this._agent = new PlaywrightAgent(this.page);
  return this._agent;
}
```

理由：与 Page Object 四层架构天然契合；Fixture 模式适合 `@playwright/test` 直写用例，与 demo 风格不一致。

---

## 3. 整体架构

```text
┌─────────────────────────────────────────────────────────────┐
│  L1 · 用户入口                                               │
│  CLI (npm test) · IDE Skill · CI (GitHub Actions)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L2 · Agent 编排层 (skills/ui-automation/)                   │
│  analyzer → implementer → verifier → curator                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L3 · 项目测试层 (projects/<name>/)                          │
│  tests/ → services/ → pages/ → components/                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L4 · 框架共享层 (core/)                                     │
│  createBrowser · withFallback · fixtures · Base*            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L5 · 执行引擎                                               │
│  Vitest → Playwright (launchPersistentContext) → Midscene   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L6 · 可观测层                                               │
│  Allure · fallback-events.log (JSONL) · Midscene Report     │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 层级依赖规则（自 demo 继承，不可破坏）

```text
tests/       → 只调 services/，只写 expect
services/    → 只调 pages/，编排业务流程
pages/       → 只调 components/ + AI/DOM，不写 expect
components/  → 通用 UI 控件，禁止依赖 pages/services
core/        → 被 projects/ 引用，不引用 projects/
skills/      → 只读规范 + 调度，不直接改 core/（implementer 改 projects/）
```

---

## 4. 目录结构

```text
Awe_test_Agent/
├── core/                              # 框架共享层
│   ├── browser/
│   │   └── createBrowser.ts           # 从 demo src/config.ts 抽取
│   ├── fallback/
│   │   └── with-fallback.ts           # CSS→AI + JSONL 日志
│   ├── fixtures/
│   │   ├── playwright.fixture.ts      # usePlaywright / usePlaywrightWithAuth
│   │   └── screenshot-on-failure.ts
│   ├── base/
│   │   ├── BasePage.ts                # getAgent() + withFallback 委托
│   │   ├── BaseService.ts
│   │   └── BaseComponent.ts
│   ├── setup/
│   │   ├── env.ts                     # Midscene 环境 zod 校验
│   │   └── globalSetup.ts
│   └── index.ts                       # 统一导出
│
├── projects/
│   ├── testerhome/                    # 从 demo src/ 迁移的示例
│   │   ├── project.config.ts          # BASE_URL、LOGIN_URL、默认标签
│   │   ├── .env.example
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── tests/
│   └── _template/                     # 新项目脚手架
│       ├── project.config.ts
│       ├── .env.example
│       ├── components/.gitkeep
│       ├── pages/.gitkeep
│       ├── services/.gitkeep
│       └── tests/example.smoke.test.ts
│
├── skills/
│   └── ui-automation/
│       ├── SKILL.md                   # 主编排（从 docs/codex 迁移 + 通用化）
│       ├── architecture-reference.md
│       ├── midscene-api-reference.md
│       ├── agents/
│       │   ├── analyzer-agent.md
│       │   ├── implementer-agent.md
│       │   ├── verifier-agent.md
│       │   └── curator-agent.md       # 新增
│       ├── best-practices/
│       │   ├── README.md
│       │   ├── auth.md
│       │   └── topics.md
│       └── artifacts/                 # 运行时产物（gitignore 内容）
│           └── README.md
│
├── scripts/
│   ├── run-test.js                    # Vitest + Allure 编排
│   ├── auth-login.js                  # 半自动登录态保存
│   ├── allure-report.js
│   ├── save-report.js
│   └── open-report.js
│
├── .github/
│   └── workflows/
│       └── test.yml                   # CI smoke
│
├── docs/
│   └── plans/                         # 设计文档
│
├── vitest.config.ts                   # PROJECT 环境变量驱动
├── tsconfig.json
├── package.json
├── AGENTS.md                          # 项目级 Agent 规则
├── .env.example
└── README.md
```

---

## 5. 多项目配置设计

### 5.1 项目配置文件

每个项目目录包含 `project.config.ts`：

```typescript
// projects/testerhome/project.config.ts
export const projectConfig = {
  name: "testerhome",
  baseUrl: "https://testerhome.com",
  loginUrl: "https://testerhome.com/account/sign_in",
  authStatePath: ".auth-state.json",   // 相对项目目录
  defaultTags: ["smoke", "regression", "p0", "p1", "p2", "auth", "topics"],
} as const;

export type ProjectConfig = typeof projectConfig;
```

环境变量优先级：

```text
process.env.BASE_URL          → 覆盖 project.config.baseUrl
process.env.LOGIN_URL         → 覆盖 project.config.loginUrl
process.env.PROJECT           → 选择 projects/<name>/（默认 testerhome）
process.env.HEADLESS          → 控制 createBrowser headless
```

### 5.2 Vitest 动态配置

```typescript
// vitest.config.ts（设计稿）
import { defineConfig } from "vitest/config";
import path from "path";

const projectName = process.env.PROJECT || "testerhome";
const projectRoot = path.resolve(__dirname, "projects", projectName);

export default defineConfig({
  test: {
    include: [`${projectRoot}/tests/**/*.test.ts`],
    globalSetup: ["core/setup/globalSetup.ts"],
    setupFiles: [
      "allure-vitest/setup",
      "core/setup/env.ts",
      `${projectRoot}/setup.ts`,       // 可选：注入 projectConfig 到 global
    ],
    sequence: { concurrent: false },
    retry: 0,
    testTimeout: 600_000,
    hookTimeout: 300_000,
    reporters: [
      "verbose",
      ["allure-vitest/reporter", { resultsDir: "./allure-results" }],
    ],
    tags: [/* 从 project.config 或全局默认读取 */],
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "core"),
      "@project": projectRoot,
    },
  },
});
```

### 5.3 项目内 import 约定

```typescript
// projects/testerhome/pages/LoginPage.ts
import { BasePage } from "@core/base/BasePage";
import { projectConfig } from "../project.config";

export class LoginPage extends BasePage {
  readonly url = projectConfig.loginUrl;
  // ...
}
```

### 5.4 新建项目流程

```bash
cp -r projects/_template projects/myapp
# 编辑 project.config.ts、.env
PROJECT=myapp npm test
```

---

## 6. withFallback 模式（原样继承 + 小增强）

### 6.1 行为不变

```text
cssAction 成功     → css_success
cssAction 失败     → aiFallback → ai_fallback_success / ai_fallback_failed
aiOnly: true       → 跳过 CSS → ai_only_success / ai_only_failed
```

日志写入：`test-results/fallback-events.log`（JSONL）。

### 6.2 增强：项目维度字段

JSONL 事件增加 `project` 字段，便于多项目统计：

```json
{
  "timestamp": "2026-05-24T10:00:00.000Z",
  "project": "testerhome",
  "type": "ai_only_success",
  "className": "TopicsPage",
  "label": "clickFirstTopic()",
  "pageUrl": "https://testerhome.com/topics"
}
```

### 6.3 BasePage 委托

```typescript
// core/base/BasePage.ts
import { runWithFallback } from "@core/fallback/with-fallback";

protected async withFallback(options: Omit<RunWithFallbackOptions, "className">) {
  return runWithFallback({
    ...options,
    className: this.constructor.name,
    getPageUrl: () => this.page.url(),
  });
}
```

---

## 7. Agent Skill 设计

### 7.1 从 demo 迁移并通用化

| demo 路径 | Awe_test_Agent 路径 | 变更 |
|-----------|---------------------|------|
| `docs/codex/ui-automation/SKILL.md` | `skills/ui-automation/SKILL.md` | 路径引用改为 skills/；支持 Cursor Task 调度说明 |
| `docs/codex/ui-automation/agents/*.md` | `skills/ui-automation/agents/*.md` | 源码路径改为 `projects/<PROJECT>/` |
| `.codebuddy/skills/ui-automation/best-practices/` | `skills/ui-automation/best-practices/` | 合并 |
| `AGENTS.md` | `AGENTS.md` | 指向 skills/ 新路径 |

### 7.2 状态机（含 Curator）

```text
START → ANALYZE → [用户确认] → IMPLEMENT → VERIFY → JUDGE
                                                        |
                    ┌───────────────────────────────────┤
                    ↓                                   ↓
                  通过                                 失败
                    ↓                                   ↓
                 CURATE                          IMPLEMENT(fix) → VERIFY
                    ↓                              （最多重试 2 次）
                 REVIEW [用户审批]
                    ↓
              落盘 / 拒绝
                    ↓
                  DONE
```

重试规则（不变）：

- `ARCHITECTURE_VIOLATION` / `AI_ONLY_VIOLATION` 不计入重试
- 仅测试执行失败计入，最多 2 次自动重试

### 7.3 Implementer 路径约定

implementer 只允许修改：

```text
projects/<PROJECT>/components/
projects/<PROJECT>/pages/
projects/<PROJECT>/services/
projects/<PROJECT>/tests/
```

禁止修改 `core/`（除非用户显式批准框架变更）。

### 7.4 Artifacts 目录

```text
skills/ui-automation/artifacts/
├── _analysis.md       # analyzer 产出
├── _verification.md   # verifier 产出
└── _curation.md       # curator 产出
```

全部在 `.gitignore` 中忽略（保留 `artifacts/README.md`）。

---

## 8. th-curator 设计（落地 + 增强）

> 基线：`th-ui-playwright-demo/docs/plans/2026-05-12-ui-automation-curator-design.md`  
> 本设计在其基础上增加 fallback 日志消费与 CSS 固化提案。

### 8.1 职责

| 输入 | 输出 |
|------|------|
| `_analysis.md` | `_curation.md`（人类可读 + JSON block） |
| 本轮 git diff（projects/<PROJECT>/） | best-practices 追加提案 |
| `test-results/fallback-events.log` | 可选 CSS 固化提案 |
| 现有 best-practices 索引 | — |

### 8.2 Curator 只读不写源码

- 唯一写权限：`_curation.md`
- 主 Agent 按用户审批机械落盘到 `skills/ui-automation/best-practices/`

### 8.3 JSON 提案 Schema（继承 demo）

支持两种 `type`：

| type | 操作 |
|------|------|
| `add_row` | 向 best-practices 表格追加一行 |
| `add_file` | 新建模块文档 + README 索引行 |

新增第三种（Awe 增强）：

| type | 操作 |
|------|------|
| `css_patch_suggestion` | 向 `_curation.md` 人类可读区输出 CSS 固化建议，**不自动改 Page 源码** |

`css_patch_suggestion` 示例：

```json
{
  "id": "P4",
  "type": "css_patch_suggestion",
  "target_file": "projects/testerhome/pages/LoginPage.ts",
  "method": "fillUsername()",
  "suggested_css": "input[name=\"user[login]\"]",
  "evidence": {
    "fallback_log": { "css_success_count": 5, "ai_only_count": 0 },
    "dom_inspector": "optional"
  },
  "note": "需用户批准后由 implementer 执行 cssAction 填充"
}
```

判据：`css_success` 连续 N 次（默认 N=3）或 analyzer 已识别稳定 DOM。

### 8.4 用户审批协议（继承 demo）

```
📚 测试通过，发现 N 个可沉淀条目：
  [1] 新增 Service 方法 → topics.md
  [2] CSS 固化建议 → LoginPage.fillUsername()
请选择：全部批准 / 全部拒绝 / 逐项批准
```

- best-practices 落盘：仅 `add_row` / `add_file`
- CSS 固化：用户批准后进入 implementer（`review_fix` 模式），非 curator 直接改代码

### 8.5 Analyzer 增强（继承 demo 设计）

`_analysis.md` 末尾强制包含：

```markdown
## 建议新增的公共方法（抽象建议）
| 方法 | 层级 | 理由 | 是否新建 |
|------|------|------|---------|
| TopicsService.openByIndex(n) | Service | 与 browseTopics 重复步骤 | 建议抽取 |
```

---

## 9. CI/CD 设计

### 9.1 GitHub Actions workflow

文件：`.github/workflows/test.yml`

触发：`push` / `pull_request` → `main`

步骤：

1. checkout
2. setup-node 20
3. `npm ci`
4. `npx playwright install --with-deps chromium`
5. `PROJECT=testerhome HEADLESS=true npm run test:smoke`
6. upload `allure-report/` artifact（失败也上传）

Secrets：

| Secret | 说明 |
|--------|------|
| `MIDSCENE_MODEL_BASE_URL` | 模型 API 地址 |
| `MIDSCENE_MODEL_API_KEY` | API Key |
| `MIDSCENE_MODEL_NAME` | 模型名称 |

### 9.2 本地与 CI 差异

| 项 | 本地默认 | CI |
|----|---------|-----|
| headless | false | true |
| ALLURE_SERVE | 可选 1 | 0（只 upload artifact） |
| 超时 | 600s | 同左 |

### 9.3 npm scripts（继承 + 修补）

| 命令 | 作用 |
|------|------|
| `npm test` | 默认 PROJECT=testerhome，Vitest + Allure |
| `npm run test:smoke` | `--tagsFilter=smoke` |
| `npm run test:p0` | `--tagsFilter=p0` |
| `npm run test:headless` | `HEADLESS=true` |
| `npm run auth` | **新增** `node scripts/auth-login.js` |
| `PROJECT=x npm test` | 切换项目 |

---

## 10. 认证态管理

继承 demo 半自动方案，路径改为项目相对：

```text
projects/testerhome/.auth-state.json   # gitignore
scripts/auth-login.js                  # 读取 PROJECT，写入对应项目目录
```

Fixture：

- `usePlaywright()` — 无登录态
- `usePlaywrightWithAuth()` — 注入 `.auth-state.json` Cookie

---

## 11. 从 demo 迁移映射

| demo 路径 | Awe_test_Agent 路径 |
|-----------|---------------------|
| `src/config.ts` | `core/browser/createBrowser.ts` + `projects/*/project.config.ts` |
| `src/utils/with-fallback.ts` | `core/fallback/with-fallback.ts` |
| `src/fixtures/*` | `core/fixtures/*` |
| `src/pages/BasePage.ts` 等 Base | `core/base/*` |
| `src/setup/*` | `core/setup/*` |
| `src/components/` | `projects/testerhome/components/` |
| `src/pages/` | `projects/testerhome/pages/` |
| `src/services/` | `projects/testerhome/services/` |
| `src/tests/` | `projects/testerhome/tests/` |
| `docs/codex/ui-automation/` | `skills/ui-automation/` |
| `.codebuddy/agents/th-*.md` | `skills/ui-automation/agents/*.md`（合并 prompt） |

### 11.1 demo 已知问题修复清单

| 问题 | 修复 |
|------|------|
| 无 `npm run auth` | package.json 添加 script |
| `@playwright/test` 未使用 | 移除 devDependency |
| 标签 `@smoke` vs `smoke` 不统一 | 统一为 Vitest tags 配置写法 |
| Vitest 注入 `BASE_URL="/"` | 保留 normalize 逻辑于 core |

---

## 12. 实施分期

### Phase 1 — Fork + 骨架（预计 1 周）

**目标**：`PROJECT=testerhome npm run test:smoke` 全绿

- [x] 从 demo copy 到 Awe_test_Agent
- [x] 抽取 `core/`，projects/testerhome 可 import
- [x] vitest.config.ts 支持 PROJECT
- [x] 修复 npm scripts 小问题
- [x] README 框架说明 + 快速开始
- [x] `projects/_template/` 脚手架

**验收**：本地 smoke 通过；目录结构符合第 4 节。

### Phase 2 — Skill 迁移 + Curator（预计 1–2 周）

**目标**：Agent 流水线在新路径下端到端跑通

- [x] 迁移 skills/ui-automation/
- [x] 更新 AGENTS.md 路径引用
- [x] 实现 curator-agent.md + SKILL 状态机 CURATE/REVIEW 分支
- [x] Analyzer `_analysis.md` 增强节
- [x] fallback-events.log 增加 project 字段

**验收**：用 Skill 新增一条测试 → verify 通过 → curator 产出提案 → 用户批准后 best-practices 追加。

### Phase 3 — CI + 可观测增强（预计 3–5 天）

**目标**：PR 自动跑 smoke，报告可下载

- [x] `.github/workflows/test.yml`
- [x] CI secrets 文档（README）
- [ ] （可选）Midscene playwright-reporter 接入
- [x] fallback 统计脚本：`npm run stats:fallback`

**验收**：GitHub Actions smoke 绿；失败时 Allure artifact 可下载。

### Phase 4 — 后续（按需）

- CSS 自动固化 implementer 流程
- `@playwright/test` Fixture 双模式
- 第二示例项目（非 TesterHome）
- Curator 成本报告面板

---

## 13. 关键不变量（写入 AGENTS.md）

1. 四层单向依赖，测试层禁止直接操作 DOM
2. Page/Component 定位必须走 `withFallback`
3. 首次实现默认 `aiOnly: true`
4. implementer 禁止修改未在 `approved_modifications` 中的已有函数
5. 架构违规 / AI-Only 违规不计入重试
6. 测试失败最多自动重试 2 次
7. curator 只写 `_curation.md`，不直接改源码
8. best-practices 结构化区域只追加不修改

---

## 14. 风险与缓解

| 风险 | 缓解 |
|------|------|
| AI 调用慢/贵 | withFallback + Curator CSS 固化；smoke 标签控制范围 |
| 多项目 tsconfig 路径复杂 | `@core` / `@project` alias 统一 |
| Midscene 模型不可用 | env.ts 启动即失败，CI secrets 文档明确 |
| Agent 生成架构违规 | verifier 架构检查 + 不计重试的强制修复轮 |
| fork 后 demo 双份维护 | demo 标注「已迁移至 Awe_test_Agent」，不再并行演进 |

---

## 15. 开放问题（实现前确认）

| # | 问题 | 建议默认 | 状态 |
|---|------|---------|------|
| 1 | 默认 PROJECT | `testerhome` | 已确认 |
| 2 | 包名 | `awe-test-agent` | 待确认 |
| 3 | Curator CSS 固化是否 Phase 2 必做 | 先做提案，不自动改代码 | 已确认 |
| 4 | demo 原仓库是否归档 | README 指向 Awe_test_Agent | 待确认 |
| 5 | LICENSE | 继承 demo ISC 或改 MIT | 待确认 |

---

## 16. 参考

- Midscene.js：https://midscenejs.com
- Midscene Playwright 集成：https://midscenejs.com/zh/integrate-with-playwright
- 基线工程：`D:\code\th-ui-playwright-demo`
- Curator 原设计：`th-ui-playwright-demo/docs/plans/2026-05-12-ui-automation-curator-design.md`
