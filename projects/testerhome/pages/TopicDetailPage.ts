import { BasePage } from "@core/base/BasePage";

/**
 * TesterHome 话题详情页
 */
export class TopicDetailPage extends BasePage {
  readonly url = "";  // 动态 URL，通过导航到达

  /**
   * 获取话题标题
   */
  async getTitle(): Promise<string> {
    const result = await this.getAgent().aiQuery<{ title: string }>(
      "提取话题详情页的标题文字，返回 { title: string }"
    );
    return result.title;
  }

  /**
   * 获取话题作者名
   */
  async getAuthor(): Promise<string> {
    const result = await this.getAgent().aiQuery<{ author: string }>(
      "提取话题详情页的作者用户名，返回 { author: string }"
    );
    return result.author;
  }

  /**
   * 获取回复数量
   */
  async getReplyCount(): Promise<number> {
    const count = await this.getAgent().aiNumber("话题详情页中显示的回复数量");
    return count;
  }

  /**
   * 点击回复按钮（需要登录）
   */
  async clickReply() {
    await this.withFallback({
      label: "clickReply()",
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("话题详情页底部的「回复」按钮");
      },
      aiOnly: true,
    });
    await this.wait(500);
  }

  /**
   * 判断当前页面是否为话题详情页
   */
  async isLoaded(): Promise<boolean> {
    return await this.getAgent().aiBoolean("当前页面是否是一个话题详情页（包含帖子正文和回复区域）");
  }
}
