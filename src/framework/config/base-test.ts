import { test as base, Browser, BrowserContext, Page, expect, TestInfo } from '@playwright/test';
import os from "os";
import { allure } from 'allure-playwright';
import CommonConstants from 'framework/constants/CommonConstants';
import { captureScreenshotWithFallback } from 'framework/utils/ScreenshotUtil';

function parseBooleanEnv(value: string | undefined, defaultValue = false): boolean {
  if (value == null) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

/**
 * maximize the firefox window.
 */
async function firefoxMaximizedViewport(browser: Browser): Promise<{ width: number; height: number }> {
  const probe = await browser.newPage({ viewport: null });
  const viewport = await probe.evaluate(() => ({
    width: window.screen.availWidth - (window.outerWidth - window.innerWidth),
    height: window.screen.availHeight - (window.outerHeight - window.innerHeight),
  }));
  await probe.close();
  return viewport;
}

// Define the Allure fixture type
export type AllureFixture = {
  allure: {
    attachDetails: (description: string) => Promise<void>;
    attachScreenshot: (name: string, screenshot: Buffer) => Promise<void>;
    addStory: (name: string) => Promise<void>;
    addEpic: (name: string) => Promise<void>;
    addFeature: (name: string) => Promise<void>;
  };
};

// Create the base test with the allure fixture
const baseTest = base.extend<{ allure: AllureFixture['allure'] }>({
  allure: [async ({ }, use, testInfo: TestInfo) => {
    const attachedScreenshots = new Set<string>();
    const allureHelper = {
      attachDetails: async (description: string) => {
        testInfo.annotations.push({ type: 'description', description });
        testInfo.annotations.push({ type: 'owner', description: os.userInfo().username });

        allure.description(description);
        allure.owner(os.userInfo().username);
      },

      attachScreenshot: async (name: string, screenshot: Buffer) => {
        const uniqueKey = `${testInfo.title}-${name}`;

        if (attachedScreenshots.has(uniqueKey)) {
          return;
        }

        if (screenshot != null) {
          await testInfo.attach(name, {
            body: screenshot,
            contentType: 'image/png'
          });
          attachedScreenshots.add(uniqueKey);
        }
      },

      addStory: async (name: string) => {
        testInfo.annotations.push({ type: 'story', description: name });
        allure.story(name);
      },

      addEpic: async (name: string) => {
        testInfo.annotations.push({ type: 'epic', description: name });
        allure.epic(name);
      },

      addFeature: async (name: string) => {
        testInfo.annotations.push({ type: 'feature', description: name });
        allure.feature(name);
      }
    };

    await use(allureHelper);
  }, { scope: 'test' }]
});

// Function to extend test with shared page instance
export const test = (function () {
  let sharedBrowser: Browser;
  let sharedContext: BrowserContext;
  let sharedPage: Page;

  const extendedTest = baseTest.extend({
    page: async ({ }, use) => {
      await use(sharedPage);
    }
  });

  // browserName and channel come from playwright.config.ts: chrome (default), edge or firefox.
  extendedTest.beforeAll(async ({ playwright, browserName, channel }) => {
    const configuredTimeout = Number(process.env.NETWORK_IDLE_TIMEOUT) || CommonConstants.ONE_MIN_TIMEOUT;
    const isHeadless = parseBooleanEnv(process.env.HEADLESS, false);
    // viewport: null makes the page fill the browser window instead of Playwright's default 1280x720.
    let viewport: { width: number; height: number } | null = null;

    if (browserName === 'firefox') {
      sharedBrowser = await playwright.firefox.launch({ headless: isHeadless });
      viewport = await firefoxMaximizedViewport(sharedBrowser);
    } else {
      // Chrome or Edge (channel 'chrome' or 'msedge').
      sharedBrowser = await playwright.chromium.launch({
        headless: isHeadless,
        channel,
        args: [
          '--start-maximized',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-features=VizDisplayCompositor',
          '--disable-default-apps',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
        ],
      });
    }

    sharedContext = await sharedBrowser.newContext({ viewport });

    const [page] = sharedContext.pages();
    sharedPage = page || await sharedContext.newPage();
    sharedContext.setDefaultTimeout(configuredTimeout);
    sharedContext.setDefaultNavigationTimeout(configuredTimeout);
    sharedPage.setDefaultTimeout(configuredTimeout);
    sharedPage.setDefaultNavigationTimeout(configuredTimeout);

    // Remove webdriver property
    await sharedPage.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
  });

  extendedTest.afterAll(async () => {
    await sharedPage.close();
    await sharedContext.close();
    await sharedBrowser.close();
  });

  extendedTest.afterEach(async ({ page, allure }, testInfo) => {
    if (page.isClosed()) {
      return;
    }

    let evidenceMessage = "Evidence screenshot was not captured.";
    try {
      const capture = await captureScreenshotWithFallback(
        page,
        10_000,
        CommonConstants.HALF_MIN_TIMEOUT - 10_000,
      );
      await allure.attachScreenshot(
        `Screenshot (${testInfo.status})`,
        capture.screenshot,
      );
      evidenceMessage = `Evidence ${capture.mode} screenshot attached (status: ${testInfo.status}).`;
      if (capture.mode !== "full-page") {
        console.warn(
          `[afterEach] Full-page screenshot timed out for "${testInfo.title}"; ` +
          `${capture.mode} evidence was attached instead. ${capture.fullPageError}`,
        );
      }
    } catch (error) {
      evidenceMessage = `Screenshot capture failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      console.warn(
        `[afterEach] ${evidenceMessage} Testcase: "${testInfo.title}".`,
      );
    }

    if (testInfo.status === testInfo.expectedStatus) {
      console.log(`[EVIDENCE] Testcase "${testInfo.title}": ${evidenceMessage}`);
      return;
    }

    const failureReason = testInfo.errors
      .map((error) => (error.message ?? "").replace(/\s+/g, " ").trim())
      .find(Boolean) || "No failure reason was provided by Playwright.";
    console.error(
      `[ASSERT FAIL] Testcase "${testInfo.title}" failed: ${failureReason}. ${evidenceMessage}`,
    );
  });

  return extendedTest;
})();

export { expect, Page };
