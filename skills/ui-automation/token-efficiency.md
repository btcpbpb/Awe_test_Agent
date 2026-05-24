# Agent Token 节约规则

> 主 Agent、verifier、implementer 在读取测试产物时必须遵守本规则，避免不必要的截图/trace/全量日志。

---

## 阅读优先级

| 测试状态 | 只读这些 | 禁止先读 |
|---------|---------|---------|
| **通过** | `test-results/verification/report.md` | 截图、trace、完整 log |
| **失败** | 1. `report.json` 2. `latest-run.log`（仅失败用例相关段落） | 全量 Allure、所有截图 |
| **仍无法定位** | `fallback-events.log` + 最新一张失败截图 | Playwright trace |
| **最后手段** | Allure HTML、trace.zip | — |

---

## 文件路径

```text
test-results/verification/report.json   ← Agent 首选（机器可读）
test-results/verification/report.md     ← 人类摘要（通过时足够）
test-results/latest-run.log               ← Vitest 完整输出
test-results/fallback-events.log          ← CSS vs AI 定位事件
skills/ui-automation/artifacts/_verification.json  ← 与 report.json 同步副本
```

---

## 失败分类 → 下一步

| failureClass | implementer 动作 |
|--------------|------------------|
| `selector_not_found` / `locator_drift` | 优化 AI 描述或 cssAction |
| `timeout` | 加 wait / 检查遮挡 |
| `assertion_failed` | 对照 report.json 的 errorMessage，必要时看一张截图 |
| `environment_failed` | 检查 .env、auth、Midscene |
| `import_error` / `type_error` | 直接改代码 |
| `architecture_violation` | architecture_fix 模式 |
| `ai_only_violation` | review_fix 模式 |

---

## verifier 输出要求

除 `_verification.md` 外，**必须确保**存在 `_verification.json`（由 `npm test` / run-test.js 自动生成，或手动运行 build-verification-report）。

verifier 在 `_verification.md` 顶部引用：

```markdown
> 结构化报告：test-results/verification/report.json
> Token 规则：skills/ui-automation/token-efficiency.md
```

---

## 禁止

1. 测试通过时打开 Allure 或截图
2. 未读 report.json 就直接读 trace
3. 把完整 `latest-run.log` 粘贴进 implementer prompt（只摘失败段落）
4. 重复读取同一 artifact 超过 2 次
