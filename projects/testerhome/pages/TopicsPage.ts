import { BasePage } from "@core/base/BasePage";
import { BASE_URL } from "@project/urls";

/**
 * TesterHome 话题列表页
 * https://testerhome.com/topics
 */
export class TopicsPage extends BasePage {
  readonly url = `${BASE_URL}/topics`;

  /**
   * 在话题列表页搜索关键词
   */
  async searchTopics(keyword: string) {
    await this.withFallback({
      label: `searchTopics("${keyword}")`,
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("页面中的搜索图标或搜索按钮");
        await this.wait(500);
        await this.getAgent().aiInput("搜索输入框", { value: keyword });
        await this.getAgent().aiKeyboardPress("搜索输入框", { keyName: "Enter" });
      },
      aiOnly: true,
    });
    await this.wait(1500);
  }

  /**
   * 点击某个节点 / 分类标签进行筛选
   */
  async clickNode(nodeName: string) {
    await this.withFallback({
      label: `clickNode("${nodeName}")`,
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap(`话题节点列表中的「${nodeName}」节点`);
      },
      aiOnly: true,
    });
    await this.wait(1000);
  }

  /**
   * 点击第一个话题标题，进入详情页
   */
  async clickFirstTopic() {
    await this.withFallback({
      label: "clickFirstTopic()",
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("话题列表中第一条话题的标题链接");
      },
      aiOnly: true,
    });
    await this.wait(1000);
  }

  /**
   * 获取当前列表中的话题标题列表
   */
  async getTopicTitles(limit = 10): Promise<string[]> {
    const result = await this.getAgent().aiQuery<{ titles: string[] }>(
      `提取话题列表页中前 ${limit} 条话题标题，返回 { titles: string[] }`
    );
    return result.titles.slice(0, limit);
  }

  /**
   * 判断列表是否有内容
   */
  async hasTopics(): Promise<boolean> {
    return await this.getAgent().aiBoolean("话题列表中是否存在至少一条话题");
  }
}
