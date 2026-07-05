# case-management Specification

## Purpose

从测试源码自动扫描并沉淀用例清单（manifest），支持元数据提取、校验与按维度查询，为用例治理与优先级调度提供数据基础。

## Requirements

### Requirement: 扫描生成用例清单

框架 SHALL 递归扫描 `projects/<PROJECT>/tests/` 下的 `*.test.ts`，解析每个带 `tags` 的 `test(...)`，生成包含 id、title、file、describe、tags、priority、owner、stability、module 的用例清单。

#### Scenario: 从测试文件提取用例

- **WHEN** 对某项目运行扫描
- **THEN** 每个声明了 `tags` 的用例被提取为一条记录，id 由 `project.module.title` slug 化生成，并按 id 排序

#### Scenario: 从注释提取元数据

- **WHEN** 测试文件包含 `@owner` 或 `@stability` 注释
- **THEN** owner 与 stability（stable/quarantined/experimental，默认 stable）被写入对应用例记录

#### Scenario: 从 tags 推导优先级

- **WHEN** 用例 tags 含 `p0`/`p1`/`p2`（可带 `@` 前缀）
- **THEN** priority 相应设为 `P0`/`P1`/`P2`，否则默认 `P3`

### Requirement: 清单校验

框架 SHALL 校验用例清单：id 重复、缺失 title/file、引用文件不存在视为错误；无 tags 或未标注优先级视为警告。

#### Scenario: 检出重复 id 与失效文件

- **WHEN** 清单中存在重复 id 或引用了不存在的文件
- **THEN** 校验结果 `valid` 为 `false` 并在 `errors` 中列出问题

#### Scenario: 缺失优先级产生警告

- **WHEN** 某用例没有 p0–p2 优先级 tag
- **THEN** 校验结果在 `warnings` 中提示该用例未标注优先级，但不影响 `valid`

### Requirement: 按维度查询用例

框架 SHALL 支持按 tag、priority、stability、owner、module 过滤用例清单。

#### Scenario: 按标签查询

- **WHEN** 以 `tag=smoke` 查询
- **THEN** 返回 tags 包含 `smoke` 的用例子集
