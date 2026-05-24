import { BasePage } from "@core/base/BasePage";
import { BASE_URL } from "@project/urls";

/**
 * TesterHome 首页
 * https://testerhome.com
 */
export class TesterHomePage extends BasePage {
  readonly url = BASE_URL;

  /**
   * 在顶部搜索框中输入关键词并提交搜索
   */
  async search(keyword: string) {
    await this.withFallback({
      label: `search("${keyword}")`,
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("页面顶部的搜索图标或搜索入口");
        await this.wait(500);
        await this.getAgent().aiInput("搜索输入框", { value: keyword });
        await this.getAgent().aiKeyboardPress("搜索输入框", { keyName: "Enter" });
      },
      aiOnly: true,
    });
    await this.wait(1000);
  }

  /**
   * 点击顶部导航中的登录链接
   */
  async clickSignIn() {
    await this.withFallback({
      label: "clickSignIn()",
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("页面右上角的「登录」链接");
      },
      aiOnly: true,
    });
    await this.wait(500);
  }

  /**
   * 获取首页是否加载完成（检测导航栏存在）
   */
  async isLoaded(): Promise<boolean> {
    return await this.getAgent().aiBoolean("页面顶部导航栏是否已加载完成");
  }

  /**
   * 获取首页帖子列表标题列表（前 N 条）
   */
  async getTopicTitles(limit = 5): Promise<string[]> {
    const result = await this.getAgent().aiQuery<{ titles: string[] }>(
      `提取页面中帖子列表的前 ${limit} 条标题，返回 { titles: string[] }`
    );
    return result.titles.slice(0, limit);
  }

  /**
   * 点击顶部导航中的「社区」链接，进入社区页面
   * AI-Only（首次实现）
   */
  async clickCommunity() {
    await this.withFallback({
      label: "clickCommunity()",
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("页面顶部导航栏中的「社区」链接或按钮");
      },
      aiOnly: true,
    });
    await this.wait(1000);
  }

  /**
   * 获取页面上显示的草稿数量
   * 从「草稿 X 篇」文案中提取数字 X 并返回
   * AI-Only（首次实现）
   */
  async getDraftCount(): Promise<number> {
    const result = await this.getAgent().aiQuery<{ draftCount: number }>(
      "找到页面上显示草稿数量的文案（格式如「草稿 12 篇」或「草稿 X 篇」），提取其中的数字，返回 { draftCount: number }"
    );
    return result.draftCount;
  }
}
