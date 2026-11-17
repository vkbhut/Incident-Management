/** Browsers the tests can run on, selected through the BROWSER environment variable. */
export type SupportedBrowser = 'chrome' | 'edge' | 'firefox';

const SUPPORTED_BROWSERS: SupportedBrowser[] = ['chrome', 'edge', 'firefox'];

export default class Browser {
  static readonly DEFAULT: SupportedBrowser = 'chrome';

  /**
   * Validates the configured browser. Chrome is used when nothing is configured.
   * @param value - value of the BROWSER environment variable
   */
  static name(value: string | undefined): SupportedBrowser {
    const browser = (value || Browser.DEFAULT).trim().toLowerCase();
    if (!SUPPORTED_BROWSERS.includes(browser as SupportedBrowser)) {
      throw new Error(`Unsupported BROWSER '${value}'. Use one of: ${SUPPORTED_BROWSERS.join(', ')}.`);
    }
    return browser as SupportedBrowser;
  }

  /** Playwright engine that runs the browser: Chrome and Edge are Chromium based. */
  static type(browser: SupportedBrowser): 'chromium' | 'firefox' {
    return browser === 'firefox' ? 'firefox' : 'chromium';
  }

  /** Installed branded browser to launch; Firefox uses Playwright's own build. */
  static channel(browser: SupportedBrowser): 'chrome' | 'msedge' | undefined {
    if (browser === 'chrome') return 'chrome';
    if (browser === 'edge') return 'msedge';
    return undefined;
  }
}
