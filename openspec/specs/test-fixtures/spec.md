# test-fixtures Specification

## Purpose

为测试提供 Vitest 生命周期 fixture，统一管理浏览器与页面的创建/销毁、登录态 Cookie 注入，以及失败时的截图取证。

## Requirements

### Requirement: 基础浏览器 Fixture

框架 SHALL 提供 `usePlaywright()` fixture，在每个用例前创建浏览器上下文与页面（默认超时 30s，headless 由 `HEADLESS=true` 或入参控制），并在用例后关闭上下文。

#### Scenario: 用例前后自动管理浏览器

- **WHEN** 测试使用 `usePlaywright()`
- **THEN** `beforeEach` 创建全新的 context 与 page，`afterEach` 关闭 context

#### Scenario: 无头模式

- **WHEN** `HEADLESS=true` 或传入 `{ headless: true }`
- **THEN** 浏览器以无头模式启动

### Requirement: 登录态注入 Fixture

框架 SHALL 提供 `usePlaywrightWithAuth()` fixture，若存在项目认证文件则注入其中的 Cookie 以跳过登录，否则以未登录状态继续并打印告警。

#### Scenario: 存在认证文件时注入 Cookie

- **WHEN** 项目的 auth-state 文件存在且包含 Cookie
- **THEN** fixture 将 Cookie 注入 context 并（在提供目标 URL 时）导航到该页面

#### Scenario: 缺少认证文件时降级

- **WHEN** 认证文件不存在
- **THEN** fixture 打印告警并以未登录状态运行，不抛出异常

### Requirement: 失败自动截图

框架 SHALL 在用例结束时，若任务失败则对当前页面截图取证。

#### Scenario: 用例失败时截图

- **WHEN** 某个用例在 `afterEach` 时状态为失败
- **THEN** 框架对当前 page 截图并保存，供报告与调试使用
