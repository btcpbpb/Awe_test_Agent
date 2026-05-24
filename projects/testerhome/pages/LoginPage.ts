import { BasePage } from "@core/base/BasePage";
import { LOGIN_URL } from "@project/urls";

/**
 * TesterHome 登录页
 * https://testerhome.com/account/sign_in
 */
export class LoginPage extends BasePage {
  readonly url = LOGIN_URL;

  /**
   * 填写用户名（邮箱或用户名）
   */
  async fillUsername(username: string) {
    await this.withFallback({
      label: `fillUsername("${username}")`,
      cssAction: async () => {
        const el = this.page.locator('input[name="user[login]"]');
        const count = await el.count();
        if (count === 0) return false;
        await el.fill(username);
        return true;
      },
      aiFallback: async () => {
        await this.getAgent().aiInput("用户名或邮箱输入框", { value: username });
      },
    });
  }

  /**
   * 填写密码
   */
  async fillPassword(password: string) {
    await this.withFallback({
      label: "fillPassword()",
      cssAction: async () => {
        const el = this.page.locator('input[name="user[password]"]');
        const count = await el.count();
        if (count === 0) return false;
        await el.fill(password);
        return true;
      },
      aiFallback: async () => {
        await this.getAgent().aiInput("密码输入框", { value: password });
      },
    });
  }

  /**
   * 点击登录按钮
   */
  async clickSubmit() {
    await this.withFallback({
      label: "clickSubmit()",
      cssAction: async () => false,
      aiFallback: async () => {
        await this.getAgent().aiTap("登录页面底部的「登录」提交按钮");
      },
      aiOnly: true,
    });
    await this.wait(1500);
  }

  /**
   * 判断登录是否成功（URL 不再含 sign_in）
   */
  async isLoginSuccess(): Promise<boolean> {
    await this.wait(1000);
    const currentUrl = this.page.url();
    return !currentUrl.includes("sign_in");
  }

  /**
   * 获取登录错误提示文字
   */
  async getErrorMessage(): Promise<string> {
    const result = await this.getAgent().aiQuery<{ error: string }>(
      "提取页面上显示的登录错误提示文字，如果没有错误则返回空字符串，返回 { error: string }"
    );
    return result.error;
  }
}
