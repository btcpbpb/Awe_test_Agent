# TesterHome 用例库

正式 Vitest 用例位于本目录及子目录。框架会自动扫描并维护 `manifest.json`。

## 治理字段

在测试文件顶部可用注释声明：

```typescript
// @owner qa-auth
// @stability stable   // stable | quarantined | experimental
```

优先级从 Vitest tags 推断：`@p0` → P0，`@p1` → P1，以此类推。

## 常用命令

```bash
npm run cases:validate              # 扫描并重写 manifest.json
npm run cases:check                 # 只校验，不写文件
npm run cases:query -- --tag smoke
npm run cases:query -- --priority P0
npm run cases:query -- --module auth
npm run cases:query -- --stability quarantined
```

## CI 建议

默认跳过 `stability=quarantined` 的用例（后续 CI 可接入 `--stability stable` 过滤）。
