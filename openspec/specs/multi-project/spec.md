# multi-project Specification

## Purpose

支持在同一框架下隔离管理多个被测应用：通过 `PROJECT` 环境变量切换项目，各项目独立维护配置、URL 与测试代码，并提供新项目脚手架模板。

## Requirements

### Requirement: 项目切换

框架 SHALL 通过 `PROJECT` 环境变量选择当前被测项目，默认值为 `testerhome`，并据此解析项目根目录 `projects/<PROJECT>/`。

#### Scenario: 默认项目

- **WHEN** 未设置 `PROJECT`
- **THEN** 当前项目为 `testerhome`，读取 `projects/testerhome/` 下的配置与测试

#### Scenario: 切换到指定项目

- **WHEN** 设置 `PROJECT=myapp`
- **THEN** 框架从 `projects/myapp/` 读取配置、URL 与测试用例

### Requirement: 项目脚手架模板

框架 SHALL 提供 `projects/_template/` 作为新项目脚手架，复制后修改配置即可接入新的被测应用。

#### Scenario: 基于模板新建项目

- **WHEN** 将 `projects/_template` 复制为 `projects/myapp` 并编辑 `project.config.ts`
- **THEN** `PROJECT=myapp` 即可运行该项目的测试，无需改动 `core/`

### Requirement: URL 解析与环境变量覆盖

框架 SHALL 从项目配置解析 `baseUrl` 与 `loginUrl`，并允许环境变量 `BASE_URL` / `LOGIN_URL` 覆盖；仅接受合法的 http(s) 绝对地址，且去除结尾多余的斜杠。

#### Scenario: 环境变量覆盖配置

- **WHEN** 设置了合法的 `BASE_URL`
- **THEN** 解析结果的 `baseUrl` 使用该环境变量值而非项目配置默认值

#### Scenario: loginUrl 默认推导

- **WHEN** 项目配置与环境变量都未提供 `loginUrl`
- **THEN** `loginUrl` 回退为 `${baseUrl}/account/sign_in`

#### Scenario: 非法 URL 被忽略

- **WHEN** `BASE_URL` 不是以 http:// 或 https:// 开头的绝对地址
- **THEN** 该值被忽略，回退到项目配置中的 `baseUrl`
