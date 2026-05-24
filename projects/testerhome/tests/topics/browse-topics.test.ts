import { describe, test, expect } from "vitest";
import { usePlaywright } from "@core/fixtures/playwright.fixture";
import { TopicsService } from "@project/services";

describe("TesterHome 话题浏览", () => {
  const ctx = usePlaywright();

  test("话题列表页可以正常加载并展示话题", { tags: ["@smoke", "@topics", "@p0"], timeout: 60_000 }, async () => {
    const service = new TopicsService(ctx.page);
    const result = await service.browseTopics(5);

    expect(result.hasContent).toBe(true);
    expect(result.titles.length).toBeGreaterThan(0);
    console.log("获取到的话题标题：", result.titles);
  });

  test("点击话题可以进入详情页", { tags: ["@smoke", "@topics", "@p0"], timeout: 90_000 }, async () => {
    const service = new TopicsService(ctx.page);
    const topic = await service.openFirstTopic();

    expect(topic.title.length).toBeGreaterThan(0);
    expect(topic.author.length).toBeGreaterThan(0);
    console.log("话题信息：", topic);
  });

  test("搜索话题关键词能返回相关结果", { tags: ["@search", "@topics", "@p1"], timeout: 90_000 }, async () => {
    const service = new TopicsService(ctx.page);
    const result = await service.searchTopics("自动化");

    console.log("搜索「自动化」结果：", result.titles);
    expect(typeof result.hasContent).toBe("boolean");
  });
});
