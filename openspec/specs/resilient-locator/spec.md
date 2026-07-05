# resilient-locator Specification

## Purpose

提供 `withFallback` 定位机制：优先使用 CSS 选择器，失败时自动降级到 AI 视觉定位，并将每次定位结果写入 JSONL 日志以支持可观测与统计。

## Requirements

### Requirement: CSS 优先与 AI 兜底

框架 SHALL 提供 `withFallback`，在非 `aiOnly` 模式下先执行 `cssAction`，当其返回 `false` 或抛异常时，自动降级执行 `aiFallback`（AI 视觉定位）。

#### Scenario: CSS 命中

- **WHEN** `cssAction` 返回 `true`
- **THEN** 定位判定为成功，不再执行 AI 兜底，并记录 `css_success` 事件

#### Scenario: CSS 失败降级到 AI

- **WHEN** `cssAction` 返回 `false` 或抛出异常
- **THEN** 执行 `aiFallback`；成功记录 `ai_fallback_success`，失败记录 `ai_fallback_failed` 并抛出错误

### Requirement: AI-Only 首次实现模式

框架 SHALL 支持 `aiOnly: true`，此时跳过 CSS 直接执行 AI 定位；这是页面/组件方法首次实现时的默认模式。

#### Scenario: aiOnly 直接走 AI

- **WHEN** 调用 `withFallback` 且 `aiOnly` 为 `true`
- **THEN** 不执行 `cssAction`，直接执行 `aiFallback`，成功记录 `ai_only_success`，失败记录 `ai_only_failed`

### Requirement: 定位事件可观测

框架 SHALL 将每次定位事件（类型、类名、label、时间戳、项目、页面 URL、错误信息）以 JSONL 追加写入 `test-results/fallback-events.log`，且日志写入失败不得影响测试流程。

#### Scenario: 事件写入 JSONL

- **WHEN** 一次 `withFallback` 调用完成
- **THEN** 对应事件以单行 JSON 追加到 `fallback-events.log`，可用于 CSS vs AI 命中率统计

#### Scenario: 日志写入失败被静默吞掉

- **WHEN** 日志目录不可写或写入异常
- **THEN** 异常被捕获，测试主流程继续执行不受影响
