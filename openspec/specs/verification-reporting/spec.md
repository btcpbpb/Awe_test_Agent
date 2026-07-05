# verification-reporting Specification

## Purpose

在测试运行前清理历史产物，运行后产出结构化验证报告：对失败进行分类、给出修复建议，并提供分层的 artifact 阅读指引，供智能体与人工排障消费。

## Requirements

### Requirement: 运行前清理产物

框架 SHALL 在全局 setup 阶段清空 `allure-results/` 与 `test-results/fallback-events.log`，避免历史数据污染本次运行。

#### Scenario: 每次运行前重置

- **WHEN** 全局 setup 执行
- **THEN** 已存在的 allure 结果目录内容与 fallback 事件日志被清空

### Requirement: 失败分类

框架 SHALL 根据错误文本将失败归类为固定集合之一（如 `selector_not_found`、`timeout`、`assertion_failed`、`environment_failed`、`import_error`、`type_error`、`architecture_violation`、`ai_only_violation`、`logic_error`、`unknown`）。

#### Scenario: 定位类错误归类

- **WHEN** 错误文本包含 "element not found" / "locator resolved to 0" / "AI 兜底也失败" 等
- **THEN** 分类为 `selector_not_found`

#### Scenario: 断言类错误归类

- **WHEN** 错误文本包含 "AssertionError" / "expect(" / "断言" 等
- **THEN** 分类为 `assertion_failed`

#### Scenario: 空错误文本

- **WHEN** 错误文本为空
- **THEN** 分类为 `unknown`

### Requirement: 修复建议

框架 SHALL 针对每种失败分类给出可操作的修复建议文本。

#### Scenario: 为定位失败给出建议

- **WHEN** 失败分类为 `selector_not_found` 或 `locator_drift`
- **THEN** 建议优化 Page/Component 的 AI 描述或 `withFallback` 的 `cssAction`，并参考 `fallback-events.log`

### Requirement: 结构化验证报告

框架 SHALL 产出验证报告，包含整体状态、用例汇总（total/passed/failed/skipped）、逐用例结果、架构违规列表、artifact 路径，以及面向智能体的分层阅读指引（`readFirst` / `readOnFailure` / `readLastResort` / `tokenRule`）。

#### Scenario: 报告汇总与指引

- **WHEN** 一次测试运行结束并生成报告
- **THEN** 报告包含状态、用例统计、各 artifact 路径与 agentHints，供按需读取以节省 token
