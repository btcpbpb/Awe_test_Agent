# UI 自动化测试 - Agent 编排 Skill

> **默认编排：Cursor 智能体**（`AI_ORCHESTRATOR=cursor`）
> 浏览器运行时默认 Midscene（`AI_RUNTIME=midscene`），可切换。
>
> Cursor IDE 调度方式见：`skills/ui-automation/cursor-orchestration.md`

---

## 双模式 AI 架构

| 层级 | 变量 | 默认 | 说明 |
|------|------|------|------|
| 编排层 | `AI_ORCHESTRATOR` | `cursor` | 写用例 / 修复 / 沉淀 → **Cursor Task 子智能体** |
| 运行时 | `AI_RUNTIME` | `midscene` | 测试执行中 `aiTap` 等 → **Midscene 或纯 Playwright** |

---

## 项目上下文

- 框架根目录：`Awe_test_Agent/`
- 当前测试项目：`process.env.PROJECT || "testerhome"`
- 项目源码：`projects/<PROJECT>/`（components、pages、services、tests）
- 框架共享层：`core/`（implementer **禁止修改**，除非用户显式批准）
- Artifacts：`skills/ui-automation/artifacts/`

---

## 你的角色

1. 调度子 Agent 按正确顺序执行
2. 判断每个 Agent 的输出，决定下一步
3. 保证不跳步、不遗漏、不突破重试上限

默认不要在这个工作流里自己做需求分析、直接改测试代码、或自己跑验证命令。

---

## 四个子 Agent（Cursor Task 调度）

> 完整 Task 参数见 `cursor-orchestration.md`

| 阶段 | 文件 | Task `subagent_type` | 职责 | 产物 |
|------|------|---------------------|------|------|
| 分析 | `agents/analyzer-agent.md` | `explore` | 解析需求、扫描代码库 | `artifacts/_analysis.md` |
| 实现 | `agents/implementer-agent.md` | `generalPurpose` | 生成或修复代码 | `projects/<PROJECT>/` 变更 |
| 验证 | `agents/verifier-agent.md` | `generalPurpose` | 架构审查、跑测试 | `artifacts/_verification.md` |
| 沉淀 | `agents/curator-agent.md` | `generalPurpose` | best-practices 提案 | `artifacts/_curation.md` |

---

## 状态机

```text
START -> ANALYZE -> [用户确认] -> IMPLEMENT -> VERIFY -> JUDGE
                                                        |
                    ┌───────────────────────────────────┤
                    ↓                                   ↓
                  通过                                 失败
                    ↓                                   ↓
                 CURATE                          IMPLEMENT(fix) -> VERIFY
                    ↓                              （最多重试 2 次）
                 REVIEW [用户审批]
                    ↓
              落盘 / 拒绝
                    ↓
                  DONE
```

### 重试计数

- `retry` 初始值为 `0`
- `ARCHITECTURE_VIOLATION` / `AI_ONLY_VIOLATION` 不计入重试
- 仅当验证报告状态为 `❌ 失败` 时，`retry += 1`
- 最多自动重试 2 次

---

## 阶段 1：分析（ANALYZE）

读取 `skills/ui-automation/agents/analyzer-agent.md` 全文，传入：

- 用户原始需求
- 项目根路径
- `PROJECT` 环境变量（默认 testerhome）

等待完成后读取 `skills/ui-automation/artifacts/_analysis.md`，展示摘要并**向用户确认**。

---

## 阶段 2：实现（IMPLEMENT）

读取 `skills/ui-automation/agents/implementer-agent.md`，按模式调度：

| 模式 | 场景 |
|------|------|
| `first_run` | 首次实现 |
| `architecture_fix` | 架构违规 |
| `review_fix` | AI-Only 违规 / CSS 固化（用户批准后） |
| `retry_fix` | 测试失败重试 |

implementer 只允许修改 `projects/<PROJECT>/` 下的 components、pages、services、tests。

---

## 阶段 3：验证（VERIFY）

读取 `skills/ui-automation/agents/verifier-agent.md`，执行：

```bash
node scripts/run-test.js --maxWorkers=1 <测试文件路径>
```

验证完成后 **先读** `test-results/verification/report.json`（见 `token-efficiency.md`）。

---

## Token 节约规则

详见 `skills/ui-automation/token-efficiency.md`。摘要：

| 状态 | Agent 只读 |
|------|-----------|
| 通过 | `report.md` |
| 失败 | `report.json` → `latest-run.log` 片段 → 截图（最后） |

implementer 修复时从 report.json 的 `failureClass` + `repairSuggestion` 入手，勿要求用户提供全量 log。

---

## 阶段 4：判断（JUDGE）

| 状态 | 动作 |
|------|------|
| `ARCHITECTURE_VIOLATION` | implementer(architecture_fix) |
| `AI_ONLY_VIOLATION` | implementer(review_fix) |
| `❌ 失败` | retry_fix（最多 2 次） |
| `✅ 通过` | 进入 CURATE |

---

## 阶段 5：沉淀（CURATE + REVIEW）

测试通过后：

1. 调度 curator，读 `_analysis.md` + git diff + `test-results/fallback-events.log`
2. 产出 `_curation.md`
3. 向用户展示提案清单（best-practices 追加 + 可选 CSS 固化建议）
4. 用户批准后机械落盘到 `skills/ui-automation/best-practices/`
5. CSS 固化建议 → 用户批准后 implementer(review_fix)
6. 清理 artifacts → DONE

### 用户审批协议

```
📚 测试通过，发现 N 个可沉淀条目：
  [1] 新增 Service 方法 → topics.md
  [2] CSS 固化建议 → LoginPage.fillUsername()
请选择：全部批准 / 全部拒绝 / 逐项批准（如「批准 1」）
```

---

## 核心原则

1. **AI-Only 优先**：首次实现全部 `aiOnly: true`
2. **四层架构**：tests → services → pages → components
3. **withFallback 必须**：Page/Component 定位走统一模式
4. **规范违规自动修复**：不打断用户
5. **curator 只写提案**：不直接改源码

---

## 禁止行为

| # | 禁止 |
|---|------|
| 1 | 跳过 analyzer 直接写代码 |
| 2 | implementer 完成后不调 verifier |
| 3 | 主 Agent 在工作流中亲自写测试代码 |
| 4 | 测试失败超过 2 次后继续自动重试 |
| 5 | implementer 修改 core/ 或不在 approved_modifications 中的已有函数 |
| 6 | curator 直接修改 best-practices 或源码 |
