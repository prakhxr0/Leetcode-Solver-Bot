import puppeteer from 'puppeteer';
import {getChromeProfilePath, GOOGLE_CHROME_EXECUTABLE_PATH} from '../config.js';
import {promises as fs} from 'fs';

class BrowserManager {
  static browser = null;
  static page = null;

  static async init() {
    if (!BrowserManager.browser) {
      const args = ["--start-maximized"];
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
        headless: process.env.HEADLESS === 'true' ? 'new' : false,
        executablePath: GOOGLE_CHROME_EXECUTABLE_PATH,
        userDataDir: chromeProfilePath,
        defaultViewport: null,
        args,
      });

      [BrowserManager.page] = await BrowserManager.browser.pages();
    }
  }

  static async getBrowserDetails() {
    if (!BrowserManager.browser || !BrowserManager.page) {
      await BrowserManager.init();
    }
    return {page: BrowserManager.page, browser: BrowserManager.browser};
  }

  static async closeBrowser() {
    if (BrowserManager.browser) {
      await BrowserManager.browser.close();
      BrowserManager.browser = null;
      BrowserManager.page = null;
    }
  }
}

export const getBrowserDetails = async () => BrowserManager.getBrowserDetails();
export const closeBrowser = async () => BrowserManager.closeBrowser();
