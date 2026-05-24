import type { Page } from "playwright";
import { PlaywrightAgent } from "@midscene/web/playwright";
import { runWithFallback } from "../fallback/with-fallback";

export abstract class BasePage {
  abstract readonly url: string;

  private _agent?: PlaywrightAgent;

  constructor(protected readonly page: Page) {}

  protected getAgent(): PlaywrightAgent {
    if (!this._agent) this._agent = new PlaywrightAgent(this.page);
    return this._agent;
  }

  protected async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState("domcontentloaded");
  }

  protected async withFallback(options: {
    label: string;
    cssAction: () => Promise<boolean>;
    aiFallback: () => Promise<void>;
    aiOnly?: boolean;
  }): Promise<void> {
    await runWithFallback({
      className: this.constructor.name,
      label: options.label,
      cssAction: options.cssAction,
      aiFallback: options.aiFallback,
      aiOnly: options.aiOnly,
      getPageUrl: () => {
        try {
          return this.page.url();
        } catch {
          return "";
        }
      },
    });
  }
}
