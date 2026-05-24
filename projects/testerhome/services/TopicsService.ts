import { BaseService } from "@core/base/BaseService";
import { TopicsPage } from "../pages/TopicsPage";
import { TopicDetailPage } from "../pages/TopicDetailPage";
import { TesterHomePage } from "../pages/TesterHomePage";
import { CommunityPage } from "../pages/CommunityPage";
import { PublishTopicPage } from "../pages/PublishTopicPage";

export interface TopicInfo {
  title: string;
  author: string;
  replyCount: number;
}

export interface TopicListResult {
  titles: string[];
  hasContent: boolean;
}

export interface PublishTopicResult {
  success: boolean;
  topicId?: string;
  errorMessage?: string;
}

/**
 * 话题服务：封装 TesterHome 话题浏览、搜索等流程
 */
export class TopicsService extends BaseService {
  private topicsPage = new TopicsPage(this.page);
  private topicDetailPage = new TopicDetailPage(this.page);
  private homePage = new TesterHomePage(this.page);
  private communityPage = new CommunityPage(this.page);
  private publishTopicPage = new PublishTopicPage(this.page);

  /**
   * 访问话题列表页并获取话题列表
   */
  async browseTopics(limit = 5): Promise<TopicListResult> {
    await this.step("导航到话题列表页", async () => {
      await this.topicsPage.goto();
    });

    const hasContent = await this.step("检查话题列表是否有内容", async () => {
      return await this.topicsPage.hasTopics();
    });

    const titles = await this.step(`获取前 ${limit} 条话题标题`, async () => {
      return await this.topicsPage.getTopicTitles(limit);
    });

    return { titles, hasContent };
  }

  /**
   * 搜索话题并返回结果标题列表
   */
  async searchTopics(keyword: string): Promise<TopicListResult> {
    await this.step(`在话题列表页搜索: "${keyword}"`, async () => {
      await this.topicsPage.goto();
      await this.topicsPage.searchTopics(keyword);
    });

    const hasContent = await this.step("检查搜索结果是否有内容", async () => {
      return await this.topicsPage.hasTopics();
    });

    const titles = await this.step("获取搜索结果标题", async () => {
      return await this.topicsPage.getTopicTitles(10);
    });

    return { titles, hasContent };
  }

  /**
   * 进入第一条话题详情，返回话题基本信息
   */
  async openFirstTopic(): Promise<TopicInfo> {
    await this.step("导航到话题列表页", async () => {
      await this.topicsPage.goto();
    });

    await this.step("点击第一条话题", async () => {
      await this.topicsPage.clickFirstTopic();
    });

    const title = await this.step("获取话题标题", async () => {
      return await this.topicDetailPage.getTitle();
    });

    const author = await this.step("获取话题作者", async () => {
      return await this.topicDetailPage.getAuthor();
    });

    const replyCount = await this.step("获取回复数量", async () => {
      return await this.topicDetailPage.getReplyCount();
    });

    return { title, author, replyCount };
  }

  /**
   * 从首页搜索话题
   */
  async searchFromHome(keyword: string): Promise<TopicListResult> {
    await this.step("导航到首页", async () => {
      await this.homePage.goto();
    });

    await this.step(`搜索关键词: "${keyword}"`, async () => {
      await this.homePage.search(keyword);
    });

    const titles = await this.step("获取搜索结果标题", async () => {
      return await this.homePage.getTopicTitles(10);
    });

    return { titles, hasContent: titles.length > 0 };
  }

  /**
   * 从社区页面搜索话题：点击社区导航 → 搜索关键词 → 获取结果
   * 前置条件：需要已登录（由调用者负责）
   */
  async searchFromCommunity(keyword: string): Promise<TopicListResult> {
    await this.step("点击顶部导航「社区」", async () => {
      await this.homePage.clickCommunity();
    });

    await this.step(`在社区页面搜索关键词: "${keyword}"`, async () => {
      await this.communityPage.searchTopics(keyword);
    });

    const titles = await this.step("获取搜索结果标题", async () => {
      return await this.communityPage.getSearchResultTitles(10);
    });

    return { titles, hasContent: titles.length > 0 };
  }

  /**
   * 发布新话题：导航到首页 → 点击社区 → 点击发布按钮 → 填写标题
   * 前置条件：已登录
   */
  async publishTopic(title: string): Promise<PublishTopicResult> {
    await this.step("导航到首页", async () => {
      await this.homePage.goto();
    });

    await this.step("点击顶部导航「社区」", async () => {
      await this.homePage.clickCommunity();
    });

    await this.step("点击「发布新话题」按钮", async () => {
      await this.communityPage.clickPublishTopicButton();
    });

    await this.step(`填写话题标题: "${title}"`, async () => {
      await this.publishTopicPage.fillTitle(title);
    });

    return { success: true };
  }
}
