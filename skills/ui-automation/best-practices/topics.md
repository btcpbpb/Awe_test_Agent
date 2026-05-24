# 话题浏览最佳实践

## 概述

TesterHome 话题列表页：`https://testerhome.com/topics`
话题详情页 URL 格式：`https://testerhome.com/topics/<id>`

---

## 推荐的 Service 调用模式

```typescript
// 浏览话题列表
const service = new TopicsService(ctx.page);
const result = await service.browseTopics(5);
expect(result.hasContent).toBe(true);

// 搜索话题
const result = await service.searchTopics("自动化");

// 进入详情
const topic = await service.openFirstTopic();
expect(topic.title.length).toBeGreaterThan(0);
```

## 已有 Service 方法

| 方法 | 说明 |
|------|------|
| `browseTopics(limit)` | 导航到话题列表 → 获取前 N 条标题 |
| `searchTopics(keyword)` | 导航到话题列表 → 搜索关键词 → 返回结果 |
| `openFirstTopic()` | 导航到话题列表 → 点击第一条 → 返回 `{ title, author, replyCount }` |
| `searchFromHome(keyword)` | 从首页搜索话题 |

## 已有 Page 方法

**TopicsPage：**

| 方法 | 说明 |
|------|------|
| `searchTopics(keyword)` | 在话题列表页搜索（AI-Only） |
| `clickNode(nodeName)` | 点击话题节点/分类筛选（AI-Only） |
| `clickFirstTopic()` | 点击第一条话题标题（AI-Only） |
| `getTopicTitles(limit)` | 获取前 N 条话题标题（AI 查询） |
| `hasTopics()` | 判断列表是否有内容（AI 布尔查询） |

**TopicDetailPage：**

| 方法 | 说明 |
|------|------|
| `getTitle()` | 获取话题标题（AI 查询） |
| `getAuthor()` | 获取作者用户名（AI 查询） |
| `getReplyCount()` | 获取回复数量（AI 数字查询） |
| `isLoaded()` | 判断是否为详情页（AI 布尔查询） |

## Fixture 选择

| 场景 | Fixture |
|------|---------|
| 浏览/搜索公开话题 | `usePlaywright()`（无需登录） |
| 需要回复/发帖功能 | `usePlaywrightWithAuth()` |

## 注意事项

- 搜索结果受实时数据影响，断言时避免对具体标题做精确匹配
- 话题列表可能分页，`getTopicTitles` 只返回当前可见的前 N 条
- 进入详情页后 URL 会变化，TopicDetailPage 的 `url` 属性留空
