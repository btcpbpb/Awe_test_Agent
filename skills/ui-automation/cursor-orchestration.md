# Cursor 智能体编排（默认模式）

> 当 `AI_ORCHESTRATOR=cursor`（默认）时，所有 UI 自动化**开发/修复/沉淀**工作由 **Cursor 智能体**完成。
> 浏览器内的 UI 操作仍由 `AI_RUNTIME` 决定（默认 `midscene`）。

---

## 两种 AI 职责

| 层级 | 环境变量 | 默认值 | 职责 |
|------|---------|--------|------|
| **编排层** | `AI_ORCHESTRATOR` | `cursor` | 分析需求、写代码、跑验证、沉淀 best-practices |
| **运行时** | `AI_RUNTIME` | `midscene` | 测试执行中 `aiTap` / `aiInput` 等浏览器内 AI 定位 |

```text
用户自然语言需求
        ↓
  Cursor 智能体流水线（编排层，默认）
  analyzer → implementer → verifier → curator
        ↓
  Vitest + Playwright 执行测试
        ↓
  Midscene / 纯 Playwright（运行时，可切换）
```

---

## 在 Cursor IDE 中使用（推荐）

主 Agent **必须**使用 **Task 工具**调度子智能体，不要单 Agent 包办全流程。

### 子 Agent 映射

| 阶段 | Task `subagent_type` | Prompt 文件 |
|------|---------------------|-------------|
| 分析 | `explore` | `skills/ui-automation/agents/analyzer-agent.md` |
| 实现 | `generalPurpose` | `skills/ui-automation/agents/implementer-agent.md` |
| 验证 | `generalPurpose` | `skills/ui-automation/agents/verifier-agent.md` |
| 沉淀 | `generalPurpose` | `skills/ui-automation/agents/curator-agent.md` |

### Analyzer 调度示例

```text
Task(
  subagent_type="explore",
  description="UI test analyze",
  prompt=[analyzer-agent.md 全文]
        + 用户需求
        + 项目根路径
        + PROJECT=testerhome
)
```

### Implementer 调度示例

```text
Task(
  subagent_type="generalPurpose",
  description="UI test implement",
  prompt=[implementer-agent.md 全文]
        + 运行模式: first_run
        + _analysis.md 路径
        + approved_modifications 清单
)
```

### 并行约束

- analyzer → implementer → verifier **必须串行**
- curator **仅在 verifier 通过后**调度
- 主 Agent 只负责状态机跳转与用户确认节点

---

## 在 CLI / CI 中使用 Cursor SDK

不在 Cursor IDE 内时，可安装 Cursor SDK 后使用同一套 Skill：

```bash
# 可选安装（Windows 若 native 编译失败可跳过，IDE 内不受影响）
npm install @cursor/sdk

# 需配置 CURSOR_API_KEY
npm run agent -- "为 TesterHome 添加搜索话题的冒烟测试"
```

---

## 切换到其它编排方式

| 场景 | 配置 |
|------|------|
| 人工写用例，不用 Agent 流水线 | `AI_ORCHESTRATOR=manual` |
| CI 只跑测试，不生成用例 | `AI_ORCHESTRATOR=manual` + `npm test` |
| 浏览器内不用 Midscene，纯 CSS | `AI_RUNTIME=playwright` |

---

## 与 Midscene 外部模型的关系

- **编排层**用 Cursor 智能体 ≠ 替换 Midscene
- 测试**执行**时 Page 层 `getAgent().aiTap()` 仍走 Midscene（当 `AI_RUNTIME=midscene`）
- Midscene 可接 OpenAI / DashScope / 任意 OpenAI 兼容 API（见 `.env.example`）
- 两套配置互不冲突，各司其职
