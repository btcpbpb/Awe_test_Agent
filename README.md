# Awe_test_Agent

> **AI 驱动的 Web UI 自动化测试框架**
>
> 基于 **Playwright + Midscene + Vitest + Allure**，从 [th-ui-playwright-demo](D:\code\th-ui-playwright-demo) fork 增强。
>
> 默认示例被测站点：[TesterHome](https://testerhome.com)

---

## 特性

- **Cursor 智能体默认编排**：分析 → 实现 → 验证 → 沉淀（`AI_ORCHESTRATOR=cursor`）
- **Midscene 视觉定位**：测试运行时 `aiTap` / `aiInput`（`AI_RUNTIME=midscene`，可换外部模型）
- **双模式可切换**：编排层与运行时独立配置
- **四层架构**：components → pages → services → tests
- **withFallback**：CSS 优先 → AI 兜底，JSONL 可观测
- **多项目支持**：`PROJECT=xxx` 切换被测应用
- **Agent Skill 流水线**：analyzer → implementer → verifier → curator
- **CI 模板**：GitHub Actions smoke 流水线

---

## 快速开始

### 1. 安装

```bash
npm install
npx playwright install chromium
cp .env.example .env
# 编辑 .env，填写 MIDSCENE_MODEL_* 配置
```

### 2. 配置 AI 模式

```bash
cp .env.example .env
```

| 变量 | 默认 | 说明 |
|------|------|------|
| `AI_ORCHESTRATOR` | `cursor` | 写用例用 Cursor 智能体 |
| `AI_RUNTIME` | `midscene` | 跑测试用 Midscene（需 `MIDSCENE_MODEL_*`） |

**在 Cursor IDE 中**：直接描述测试需求即可，智能体会走流水线（无需 `CURSOR_API_KEY`）。

**CLI 跑 Agent**：`npm run agent -- "添加 xxx 测试"`（需 `CURSOR_API_KEY`）。

### 3. 运行测试

```bash
# 默认项目 testerhome，全量测试
npm test

# 冒烟测试
npm run test:smoke

# 无头模式
npm run test:headless

# 切换项目
PROJECT=testerhome npm test
```

### 4. 查看报告

```bash
npm run report
```

### 5. 登录态（可选）

```bash
npm run auth
# Cookie 保存到 projects/testerhome/.auth-state.json
```

---

## 目录结构

```text
Awe_test_Agent/
├── core/                 # 框架共享层
├── projects/
│   ├── testerhome/       # 示例项目
│   └── _template/        # 新项目脚手架
├── skills/ui-automation/ # Agent Skill
├── scripts/              # 测试编排脚本
└── docs/plans/           # 设计文档
```

---

## 新建测试项目

```bash
cp -r projects/_template projects/myapp
# 编辑 projects/myapp/project.config.ts
PROJECT=myapp npm test
```

---

## Agent Skill 用法

在 Cursor 中描述测试需求，Agent 会按 `skills/ui-automation/SKILL.md` 编排：

1. **Analyzer** — 分析需求、扫描复用
2. **Implementer** — 生成四层架构代码
3. **Verifier** — 跑测试、架构检查
4. **Curator** — 沉淀 best-practices + CSS 固化建议

详见 [AGENTS.md](./AGENTS.md)。

---

## CI 配置

GitHub Actions 需在仓库 Secrets 中配置：

| Secret | 说明 |
|--------|------|
| `MIDSCENE_MODEL_BASE_URL` | 模型 API 地址 |
| `MIDSCENE_MODEL_API_KEY` | API Key |
| `MIDSCENE_MODEL_NAME` | 模型名称 |
| `TEST_USERNAME` | 可选，登录测试账号 |
| `TEST_PASSWORD` | 可选 |

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm test` | 运行测试 + 生成 Allure |
| `npm run test:smoke` | 冒烟标签 |
| `npm run test:p0` | P0 优先级 |
| `npm run auth` | 半自动登录保存 Cookie |
| `npm run cases:validate` | 扫描用例并重写 manifest.json |
| `npm run cases:query -- --tag smoke` | 按 tag/优先级查询用例 |
| `npm run check:env` | 检查双模式 AI 配置 |
| `npm run stats:fallback` | CSS vs AI 命中率统计 |
| `npm run report` | 打开 Allure 报告 |

---

## 设计文档

- [框架设计](./docs/plans/2026-05-24-awe-test-agent-design.md)

---

## 技术栈

| 组件 | 选型 |
|------|------|
| 浏览器 | [Playwright](https://playwright.dev) |
| AI 引擎 | [Midscene](https://midscenejs.com) |
| 测试运行 | [Vitest](https://vitest.dev) |
| 报告 | [Allure](https://allurereport.org) |
