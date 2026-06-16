import puppeteer from 'puppeteer';
import {getChromeProfilePath, GOOGLE_CHROME_EXECUTABLE_PATH} from '../config.js';
import {promises as fs} from 'fs';
import Logger from '../utils/Logger.js';

class BrowserManager {
  static browser = null;
  static page = null;

  static async init() {
    if (!BrowserManager.browser) {
      const args = [
        "--start-maximized",
        "--disk-cache-size=209715200",       // 200MB cap on HTTP cache
        "--media-cache-size=104857600",      // 100MB cap on media cache
        "--disable-application-cache",       // disable AppCache entirely
        "--disable-crash-reporter",          // no crash dumps
        "--disable-breakpad",                // no crash dumps
        "--noerrdialogs",                    // suppress error dialogs
        "--disable-extensions",              // no extensions memory
        "--disable-background-networking",   // reduce background activity
        "--disable-default-apps",            // no built-in apps
        "--disable-sync",                    // no sync service
        "--no-first-run",                    // skip first run tasks
      ];
      if (process.platform !== "win32") {
        args.push("--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage");
      }

      // Ensure Chrome profile directory exists
      const chromeProfilePath = getChromeProfilePath();
      try {
        await fs.access(chromeProfilePath);
      } catch (_) {
        await fs.mkdir(chromeProfilePath, {recursive: true});
      }

    // Clean up stale Chrome lock files from previous sessions
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    for (const file of lockFiles) {
        try {
            const filePath = `${chromeProfilePath}/${file}`;
            const stats = await fs.lstat(filePath).catch(() => null);
            if (stats && (stats.isSymbolicLink() || stats.isFile())) {
                await fs.unlink(filePath);
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.warn(`Warning: Could not delete ${file}: ${err.message}`);
            }
        }
    }

      BrowserManager.browser = await puppeteer.launch({
        headless: false,
        executablePath: GOOGLE_CHROME_EXECUTABLE_PATH,
        userDataDir: chromeProfilePath,
        defaultViewport: null,
        args,
      });

      [BrowserManager.page] = await BrowserManager.browser.pages();
    }
  }

  static async getPage() {
    if (!BrowserManager.browser || !BrowserManager.page) {
      await BrowserManager.init();
    }
    return BrowserManager.page;
  }

  static async resetPage() {
    if (!BrowserManager.page) return;
    Logger.warn(`[RESET_PAGE]\t\t: Clearing page state...`);
    try {
      // Clear DOM and JS state by navigating to about:blank
      await BrowserManager.page.goto('about:blank', {waitUntil: 'load', timeout: 5000});
      // Clear storage via CDP
      const client = await BrowserManager.page.createCDPSession();
      await client.send('Storage.clearCookies');
      await client.send('Runtime.evaluate', {expression: 'try{localStorage.clear()}catch(e){}'});
      await client.send('Runtime.evaluate', {expression: 'try{sessionStorage.clear()}catch(e){}'});
      await client.detach();
      // Clear HTTP cache
      await BrowserManager.clearCache();
      Logger.success(`[RESET_PAGE]\t\t: Page state cleared.`);
    } catch (err) {
      Logger.error(`[RESET_PAGE_FAILED]\t:${err.message}. Resetting browser...`);
      await BrowserManager.resetBrowser();
    }
  }

  static async getBrowserDetails() {
    if (!BrowserManager.browser || !BrowserManager.page) {
      await BrowserManager.init();
    }
    return {page: BrowserManager.page, browser: BrowserManager.browser};
  }

  static async clearCache() {
    if (!BrowserManager.page) return;
    try {
      const client = await BrowserManager.page.createCDPSession();
      await client.send('Network.clearBrowserCache');
      await client.detach();
    } catch (_) {}
  }

  static async resetBrowser() {
    Logger.warn(`[BROWSER_RESET]\t\t: Restarting browser...`);
    await BrowserManager.closeBrowser();
    await BrowserManager.init();
    Logger.success(`[BROWSER_RESET]\t\t: Browser restarted.`);
  }

  static async closeBrowser() {
    if (BrowserManager.browser) {
      try {
        await BrowserManager.browser.close();
      } catch (_) {
        // Force-kill the child process if graceful close fails
        try {
          const proc = BrowserManager.browser.process();
          if (proc) proc.kill('SIGKILL');
        } catch (_) {}
      }
      BrowserManager.browser = null;
      BrowserManager.page = null;
    }
  }
}

export const getBrowserDetails = async () => BrowserManager.getBrowserDetails();
export const getPage = async () => BrowserManager.getPage();
export const resetPage = async () => BrowserManager.resetPage();
export const clearBrowserCache = async () => BrowserManager.clearCache();
export const resetBrowser = async () => BrowserManager.resetBrowser();
export const closeBrowser = async () => BrowserManager.closeBrowser();
