import { BasePage } from "@core/base/BasePage";
import { BASE_URL } from "@project/urls";

/**
 * 社区页面
 *
 * 包含话题列表、发布新话题按钮等元素。
 */
export class CommunityPage extends BasePage {
  readonly url = `${BASE_URL}/topics`;

  /**
   * 点击「发布新话题」按钮
   * AI-Only（首次实现）
   */
  async clickPublishTopicButton() {
    await this.withFallback({
      label: "clickPublishTopicButton()",
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap(
          "页面右侧或顶部区域中包含「发布新话题」或「发帖」或「新建话题」文字的按钮或链接"
        );
      },
      aiOnly: true,
    });
    await this.wait(1000);
  }

  /**
   * 在社区页面搜索框输入关键词并提交搜索
   * AI-Only（首次实现）
   */
  async searchTopics(keyword: string) {
    await this.withFallback({
      label: `searchTopics("${keyword}")`,
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("页面右上角的搜索图标或搜索输入框");
        await this.wait(500);
        await this.getAgent().aiInput("搜索输入框", { value: keyword });
        await this.getAgent().aiKeyboardPress("搜索输入框", {
          keyName: "Enter",
        });
      },
      aiOnly: true,
    });
    await this.wait(1500);
  }

  /**
   * 获取当前搜索结果页面中的话题标题列表
   * AI-Only（首次实现）
   */
  async getSearchResultTitles(limit = 10): Promise<string[]> {
    const result = await this.getAgent().aiQuery<{ titles: string[] }>(
      `提取搜索结果页面中前 ${limit} 条话题标题，返回 { titles: string[] }`
    );
    return result.titles.slice(0, limit);
  }
}
