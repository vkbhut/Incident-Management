import { PlaywrightTestConfig } from "@playwright/test";
import dotenv from 'dotenv';
import Browser from "./src/framework/manager/Browser";

dotenv.config();

const timeInMin: number = 60 * 1000;
// chrome (default), edge or firefox; anything else stops the run with a clear error.
const selectedBrowser = Browser.name(process.env.BROWSER);
const selectedTestName = (process.env.TEST_NAME || '').trim();
const failurePath = "./test-results/failure";
const allureResultsPath = './allure-results';
const reportPath = "./test-results/report";
const resultsPath = "./test-results/results";
const monocartReportPath = "./test-results/monocart-report/index.html";

function parseBooleanEnv(value: string | undefined, defaultValue = false) {
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

/** Reads a whole number from .env, falling back to the default when it is missing or invalid. */
function numberEnv(value: string | undefined, defaultValue: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

const isHeadless = parseBooleanEnv(process.env.HEADLESS, false);
const slowMo = Math.max(0, Math.min(1500, Number.parseInt(process.env.SLOW_MO || '250', 10) || 250));

const config: PlaywrightTestConfig = {
  use: {
    browserName: Browser.type(selectedBrowser),
    headless: isHeadless,
    channel: Browser.channel(selectedBrowser),
    launchOptions: {
      headless: isHeadless,
      timeout: numberEnv(process.env.BROWSER_LAUNCH_TIMEOUT, 0),
      slowMo,
    },
    viewport: null,
    actionTimeout: numberEnv(process.env.ACTION_TIMEOUT, 2) * timeInMin,
    navigationTimeout: numberEnv(process.env.NAVIGATION_TIMEOUT, 4) * timeInMin,
    screenshot: {
      mode: "on-first-failure",
      fullPage: true,
    },
    video: "retain-on-failure",
  },
  fullyParallel: true,
  testDir: "./src/tests",
  outputDir: failurePath,
  retries: numberEnv(process.env.RETRIES, 0),
  preserveOutput: "failures-only",
  reportSlowTests: null,
  timeout: numberEnv(process.env.TEST_TIMEOUT, 20) * timeInMin,
  workers: numberEnv(process.env.PARALLEL_THREAD, 1),
  reporter: process.argv.includes("--list") ? [["dot"]] : [
    ["dot"],
    ["allure-playwright", {
      detail: false,
      suiteTitle: false,
      environmentInfo: {
        OS: process.platform.toUpperCase(),
        BROWSER: selectedBrowser.toUpperCase(),
        BASE_URL: process.env.INCIDENT_REPORTS_BASE_URL || '',
      },
      outputFolder: allureResultsPath,
    }],
    ['html', { open: 'never', outputFolder: reportPath }],
    ["junit", { outputFile: `${resultsPath}/results.xml` }],
    ["json", { outputFile: `${resultsPath}/results.json` }],
    ["./src/framework/logger/TestListener.ts"],
    ["monocart-reporter", {
      name: "Incident Management Automation Report",
      outputFile: monocartReportPath,
    }],
  ],
  projects: [
    {
      name: "local",
      testMatch: `*${selectedTestName}*`,
    },
    {
      name: "sanity",
      testMatch: `*${selectedTestName}*`,
      grep: /@sanity/,
    },
    {
      name: "regression",
      testMatch: `*${selectedTestName}*`,
      grep: /@regression/,
    },
    {
      name: "suite",
      testMatch: "*.spec.ts",
    },
  ],
};
export default config;
