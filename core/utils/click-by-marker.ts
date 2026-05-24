import type { Page } from "playwright";

type Frame = ReturnType<Page["frames"]>[number];

export const CLICK_MARKER_ATTR = "data-e2e-click-target";

export async function clickByMarker(
  ctx: Page | Frame,
  markerSetter: () => Promise<boolean>
): Promise<boolean> {
  await ctx
    .evaluate((attr: string) => {
      document
        .querySelectorAll(`[${attr}]`)
        .forEach((el) => el.removeAttribute(attr));
    }, CLICK_MARKER_ATTR)
    .catch(() => {});

  const marked = await markerSetter();
  if (!marked) return false;

  try {
    await ctx.locator(`[${CLICK_MARKER_ATTR}]`).first().click();
    return true;
  } finally {
    await ctx
      .evaluate((attr: string) => {
        document
          .querySelectorAll(`[${attr}]`)
          .forEach((el) => el.removeAttribute(attr));
      }, CLICK_MARKER_ATTR)
      .catch(() => {});
  }
}
