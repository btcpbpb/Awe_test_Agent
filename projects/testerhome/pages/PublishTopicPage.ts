import { BasePage } from "@core/base/BasePage";
import { BASE_URL } from "@project/urls";

/**
 * 发布话题页面
 *
 * 包含节点选择、标题输入、内容编辑等元素。
 */
export class PublishTopicPage extends BasePage {
  readonly url = `${BASE_URL}/topics/new`;

  /**
   * 在「选择节点」右边的标题输入框中填写标题
   * AI-Only（首次实现）
   */
  async fillTitle(title: string) {
    await this.withFallback({
      label: "fillTitle()",
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiInput(
          "「选择节点」右边的填写标题的输入框",
          { value: title }
        );
      },
      aiOnly: true,
    });
    await this.wait(500);
  }
}
