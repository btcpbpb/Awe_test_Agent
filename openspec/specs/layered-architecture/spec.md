# layered-architecture Specification

## Purpose

约束测试代码组织为严格单向依赖的四层架构（tests → services → pages → components），并通过 `@core/base` 抽象基类提供统一能力，保证可维护性与关注点分离。

## Requirements

### Requirement: 四层单向依赖

框架 SHALL 将代码分为 components、pages、services、tests 四层，且依赖方向严格单向：tests → services → pages → components，禁止反向依赖与跨层调用。

#### Scenario: 合法的分层调用链

- **WHEN** 一个测试需要执行业务操作
- **THEN** 测试层只调用 services 层，services 层持有并调用 pages 层，pages 层组合 components 层

#### Scenario: 跨层或反向调用被识别为违规

- **WHEN** 测试层直接 `new XxxPage()` 或 components 层依赖 pages/services
- **THEN** 该代码被判定为架构违规（`architecture_violation`），应将操作下沉到正确层级

### Requirement: 抽象基类

框架 SHALL 提供 `BaseComponent`、`BasePage`、`BaseService` 抽象基类，各层类通过继承获得 `page` 引用、`getAgent()`（Midscene PlaywrightAgent）与 `wait()` 能力。

#### Scenario: 页面类继承 BasePage

- **WHEN** 定义一个页面类
- **THEN** 它继承 `@core/base/BasePage`，声明 `readonly url: string`，并可调用 `goto()` 导航到该 URL

#### Scenario: 服务类持有页面实例

- **WHEN** 定义一个服务类
- **THEN** 它继承 `@core/base/BaseService`，在构造函数中创建并持有 Page 实例，暴露返回类型化结果的业务方法

### Requirement: 断言仅限测试层

框架 SHALL 只允许在 tests 层编写 `expect` 断言；components、pages、services 层禁止出现断言。

#### Scenario: 组件/页面/服务层无断言

- **WHEN** 检查非测试层代码
- **THEN** 其中不包含任何 `expect(...)` 调用，断言全部集中在 `*.test.ts`

### Requirement: 命名与导出约定

框架 SHALL 规定各层文件命名（`XxxComponent` / `XxxPage` / `XxxDialog` / `XxxService` / `xxx.test.ts`），且新增的组件、页面、服务必须在对应目录的 `index.ts` 中导出。

#### Scenario: 新增组件后导出

- **WHEN** 在 `projects/<PROJECT>/components/` 新增一个组件类
- **THEN** 文件名以 `Component` 结尾，且该类在 `components/index.ts` 中被导出
