import type { Page } from "@playwright/test";

export interface ScreenshotCaptureResult {
  screenshot: Buffer;
  mode: "full-page" | "viewport" | "cdp-viewport";
  fullPageError?: string;
  viewportError?: string;
}

type ScreenshotCapablePage = Pick<Page, "screenshot"> &
  Partial<Pick<Page, "context">>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Captures a full-page screenshot
 */
export async function captureScreenshotWithFallback(
  page: ScreenshotCapablePage,
  fullPageTimeout = 10_000,
  viewportTimeout = 20_000,
): Promise<ScreenshotCaptureResult> {
  try {
    const screenshot = await page.screenshot({
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      timeout: fullPageTimeout,
    });
    return { screenshot, mode: "full-page" };
  } catch (fullPageError) {
    try {
      const screenshot = await page.screenshot({
        fullPage: false,
        animations: "disabled",
        caret: "hide",
        timeout: viewportTimeout,
      });
      return {
        screenshot,
        mode: "viewport",
        fullPageError: errorMessage(fullPageError),
      };
    } catch (viewportError) {
      let session: Awaited<ReturnType<ReturnType<Page["context"]>["newCDPSession"]>> | undefined;
      try {
        const context = page.context?.();
        if (!context) {
          throw new Error("A browser context is unavailable for CDP capture.");
        }
        session = await context.newCDPSession(page as Page);
        const response = await session.send("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
          captureBeyondViewport: false,
        });
        return {
          screenshot: Buffer.from(response.data, "base64"),
          mode: "cdp-viewport",
          fullPageError: errorMessage(fullPageError),
          viewportError: errorMessage(viewportError),
        };
      } catch (cdpError) {
        throw new Error(
          `Full-page screenshot failed: ${errorMessage(fullPageError)} ` +
            `Viewport fallback failed: ${errorMessage(viewportError)} ` +
            `CDP fallback failed: ${errorMessage(cdpError)}`,
        );
      } finally {
        await session?.detach().catch(() => undefined);
      }
    }
  }
}
