# 登录/认证最佳实践

## 概述

TesterHome 登录页地址：`https://testerhome.com/account/sign_in`

登录成功后 URL 会离开 sign_in 页面，可通过 `page.url()` 判断。
登录态通过 `_homeland_session` cookie 维持。

---

## 推荐的 Service 调用模式

```typescript
const service = new AuthService(ctx.page);
const result = await service.login(username, password);
expect(result.success).toBe(true);
```

## 已有 Service 方法

| 方法 | 说明 |
|------|------|
| `login(username, password)` | 打开登录页 → 填表单 → 提交 → 返回 `{ success, errorMessage }` |
| `isLoggedIn()` | 访问首页，检查右上角是否有用户头像（AI 判断） |

## 已有 Page 方法

**LoginPage：**

| 方法 | 说明 |
|------|------|
| `fillUsername(username)` | 填写用户名/邮箱（CSS 优先：`input[name="user[login]"]`） |
| `fillPassword(password)` | 填写密码（CSS 优先：`input[name="user[password]"]`） |
| `clickSubmit()` | 点击登录按钮（AI-Only） |
| `isLoginSuccess()` | 检查 URL 是否离开 sign_in |
| `getErrorMessage()` | 提取错误提示文字（AI 查询） |

## Fixture 选择

| 场景 | Fixture |
|------|---------|
| 测试登录本身 | `usePlaywright()` |
| 测试登录后的功能 | `usePlaywrightWithAuth()` |

## 注意事项

- 用错误密码登录时，页面不会跳转，会显示错误提示
- 若需要在 CI 中跑登录用例，需配置 `TEST_USERNAME` 和 `TEST_PASSWORD` 环境变量
- TesterHome 无强制验证码，可直接自动化登录
