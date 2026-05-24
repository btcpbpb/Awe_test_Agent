# Project Instructions

## 默认模式：Cursor 智能体

本框架 **默认使用 Cursor 智能体** 编排 UI 自动化工作（`AI_ORCHESTRATOR=cursor`）。

浏览器内的 AI 定位默认仍用 **Midscene**（`AI_RUNTIME=midscene`），可接 OpenAI / DashScope 等外部模型。

| 层级 | 环境变量 | 默认 | 职责 |
|------|---------|------|------|
| 编排 | `AI_ORCHESTRATOR` | `cursor` | 分析 / 写用例 / 验证 / 沉淀 |
| 运行时 | `AI_RUNTIME` | `midscene` | 测试执行中的 aiTap / aiInput |

切换方式见 `.env.example` 与 `skills/ui-automation/cursor-orchestration.md`。

---

## UI Automation Skill

当用户要求创建、修改、修复或调试 UI 自动化测试时：

- **`AI_ORCHESTRATOR=cursor`（默认）**：必须走 Cursor Task 子智能体流水线
- **`AI_ORCHESTRATOR=manual`**：用户明确要求时，可直接改代码

### 入口文件

- 主编排：`skills/ui-automation/SKILL.md`
- **Cursor 调度**：`skills/ui-automation/cursor-orchestration.md`
- 分析：`skills/ui-automation/agents/analyzer-agent.md`
- 实现：`skills/ui-automation/agents/implementer-agent.md`
- 验证：`skills/ui-automation/agents/verifier-agent.md`
- 沉淀：`skills/ui-automation/agents/curator-agent.md`
- **Token 节约**：`skills/ui-automation/token-efficiency.md`

1. 主 Agent 读取 `SKILL.md` + `cursor-orchestration.md`
2. 用 **Task 工具**串行调度：`explore` → `generalPurpose` × 3
3. 禁止主 Agent 独自完成分析、实现、验证
4. CLI 非 IDE 场景：`npm run agent -- "需求描述"`（需 `CURSOR_API_KEY`）

### 强制执行规则

1. analyzer → implementer → verifier → curator（通过后）
2. 主要确认节点：analyzer 摘要、curator 沉淀审批
3. implementer 只改 `projects/<PROJECT>/`，禁止改 `core/`
4. 测试失败最多自动重试 2 次
5. artifacts：`skills/ui-automation/artifacts/`

### 其它模型接入（运行时）

Midscene 支持任意 OpenAI 兼容 API，配置 `MIDSCENE_MODEL_*` 即可。
纯 Playwright（无 AI 定位）：`AI_RUNTIME=playwright`。

### 关键不变量

1. 四层单向依赖：tests → services → pages → components
2. Page/Component 必须走 `withFallback`
3. 首次实现默认 `aiOnly: true`
4. 测试层只写 `expect`
