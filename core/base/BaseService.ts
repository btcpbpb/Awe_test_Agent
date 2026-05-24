import type { Page } from "playwright";
import { PlaywrightAgent } from "@midscene/web/playwright";

export abstract class BaseService {
  private _agent?: PlaywrightAgent;

  constructor(protected readonly page: Page) {}

  protected getAgent(): PlaywrightAgent {
    if (!this._agent) this._agent = new PlaywrightAgent(this.page);
    return this._agent;
  }

  protected async step<T>(description: string, fn: () => Promise<T>): Promise<T> {
    console.log(`[${this.constructor.name}] 步骤：${description}`);
    return await fn();
  }

  protected async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }
}
