import type { Page } from "playwright";
import { PlaywrightAgent } from "@midscene/web/playwright";
import {
  clickByMarker as clickByMarkerUtil,
  CLICK_MARKER_ATTR as CLICK_MARKER_ATTR_VALUE,
} from "../utils/click-by-marker";
import { runWithFallback } from "../fallback/with-fallback";

type Frame = ReturnType<Page["frames"]>[number];

export const CLICK_MARKER_ATTR = CLICK_MARKER_ATTR_VALUE;

export abstract class BaseComponent {
  private _agent?: PlaywrightAgent;

  constructor(protected readonly page: Page) {}

  protected getAgent(): PlaywrightAgent {
    if (!this._agent) this._agent = new PlaywrightAgent(this.page);
    return this._agent;
  }

  protected async wait(ms: number) {
    await this.page.waitForTimeout(ms);
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

  protected async clickByMarker(
    markerSetter: () => Promise<boolean>,
    frame?: Frame
  ): Promise<boolean> {
    return await clickByMarkerUtil(frame ?? this.page, markerSetter);
  }
}
