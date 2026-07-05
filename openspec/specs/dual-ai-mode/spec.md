# dual-ai-mode Specification

## Purpose

将 AI 的两种职责解耦为独立可配置的模式：编排层（AI_ORCHESTRATOR，负责分析/写用例/验证/沉淀）与运行时（AI_RUNTIME，负责测试执行中的浏览器内定位），二者互不影响。

## Requirements

### Requirement: 编排模式配置

框架 SHALL 通过 `AI_ORCHESTRATOR` 环境变量选择编排模式，取值为 `cursor`（默认）或 `manual`，非法或缺省值回退为 `cursor`。

#### Scenario: 默认使用 Cursor 编排

- **WHEN** 未设置 `AI_ORCHESTRATOR`
- **THEN** `getAiConfig().orchestrator` 为 `cursor`，`isCursorOrchestrator()` 返回 `true`

#### Scenario: 显式手动模式

- **WHEN** `AI_ORCHESTRATOR=manual`
- **THEN** `orchestrator` 为 `manual`，允许人工直接修改代码而不走智能体流水线

### Requirement: 运行时模式配置

框架 SHALL 通过 `AI_RUNTIME` 环境变量选择运行时定位引擎，取值为 `midscene`（默认）或 `playwright`，非法或缺省值回退为 `midscene`。

#### Scenario: 默认使用 Midscene 运行时

- **WHEN** 未设置 `AI_RUNTIME`
- **THEN** `runtime` 为 `midscene`，`isMidsceneRuntime()` 返回 `true`，测试执行支持 `aiTap` / `aiInput`

#### Scenario: 纯 Playwright 运行时

- **WHEN** `AI_RUNTIME=playwright`
- **THEN** `runtime` 为 `playwright`，表示不使用 AI 视觉定位

### Requirement: 运行时配置校验

框架 SHALL 提供 Midscene 必填环境变量（`MIDSCENE_MODEL_BASE_URL`、`MIDSCENE_MODEL_API_KEY`、`MIDSCENE_MODEL_NAME`）的缺失检测能力。

#### Scenario: 检测缺失的 Midscene 配置

- **WHEN** 调用 `getMissingMidsceneKeys()`
- **THEN** 返回当前 `process.env` 中缺失的 Midscene 必填变量名列表，供 `check:env` 脚本提示用户
