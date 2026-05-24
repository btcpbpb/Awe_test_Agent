import { BaseService } from "@core/base/BaseService";
import { LoginPage } from "../pages/LoginPage";
import { TesterHomePage } from "../pages/TesterHomePage";

export interface LoginResult {
  success: boolean;
  errorMessage?: string;
}

export interface DraftCountResult {
  success: boolean;
  draftCount: number;
}

/**
 * 认证服务：封装 TesterHome 登录/登出相关流程
 */
export class AuthService extends BaseService {
  private loginPage = new LoginPage(this.page);
  private homePage = new TesterHomePage(this.page);

  /**
   * 使用用户名和密码登录
   */
  async login(username: string, password: string): Promise<LoginResult> {
    await this.step("导航到登录页", async () => {
      await this.loginPage.goto();
    });

    await this.step(`填写用户名: ${username}`, async () => {
      await this.loginPage.fillUsername(username);
    });

    await this.step("填写密码", async () => {
      await this.loginPage.fillPassword(password);
    });

    await this.step("点击登录", async () => {
      await this.loginPage.clickSubmit();
    });

    const success = await this.step("检查登录结果", async () => {
      return await this.loginPage.isLoginSuccess();
    });

    if (!success) {
      const errorMessage = await this.loginPage.getErrorMessage();
      return { success: false, errorMessage };
    }

    return { success: true };
  }

  /**
   * 访问首页并检查是否处于已登录状态
   */
  async isLoggedIn(): Promise<boolean> {
    await this.step("访问首页", async () => {
      await this.homePage.goto();
    });

    return await this.step("检查登录状态", async () => {
      return await this.getAgent().aiBoolean(
        "页面右上角是否显示用户头像或用户名（表示已登录状态）"
      );
    });
  }

  /**
   * 获取当前页面上的草稿数量
   * 前置条件：已登录
   * 流程：点击顶部导航「社区」→ 从页面提取「草稿 X 篇」数量
   */
  async getDraftCount(): Promise<DraftCountResult> {
    await this.step("点击顶部导航「社区」", async () => {
      await this.homePage.clickCommunity();
    });

    const draftCount = await this.step("获取草稿数量", async () => {
      return await this.homePage.getDraftCount();
    });

    return { success: true, draftCount };
  }
}
