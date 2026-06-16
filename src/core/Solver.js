import Logger from '../utils/Logger.js';
import FileManager from '../file/FileManager.js';
import LeetCodeAPI from '../api/LeetCodeAPI.js';
import {newPage, clearBrowserCache, closeBrowser, resetBrowser} from '../browser/BrowserManager.js';
import {sleep} from '../utils/helpers.js';

const LANG_IDS = {
  cpp: 'cpp', java: 'java', python: 'python', python3: 'python',
  mysql: 'mysql', javascript: 'javascript', golang: 'go', csharp: 'csharp',
  typescript: 'typescript', kotlin: 'kotlin', swift: 'swift', ruby: 'ruby',
  rust: 'rust', scala: 'scala', c: 'c', bash: 'bash', mssql: 'sql',
};

const LANG_DISPLAY = {
  cpp: 'C++', java: 'Java', python: 'Python', python3: 'Python3',
  mysql: 'MySQL', javascript: 'JavaScript', golang: 'Go', csharp: 'C#',
  typescript: 'TypeScript', kotlin: 'Kotlin', swift: 'Swift', ruby: 'Ruby',
  rust: 'Rust', scala: 'Scala', c: 'C', bash: 'Bash', mssql: 'MSSQL',
};

class Solver {
  static async #isSolvedEarlier(problemName) {
    const solved = await FileManager.getSolvedProblemSet();
    return solved.has(problemName);
  }

  static async #getEditorLangId(page) {
    return page.evaluate(() => {
      const models = window.monaco?.editor?.getModels();
      return models?.length > 0 ? models[0].getLanguageId() : null;
    });
  }

  static async #switchLanguage(page, targetLangId, displayName) {
    Logger.warn(`[SWITCHING_LANGUAGE]\t\t:${displayName}`);

    const langNames = Object.values(LANG_DISPLAY);
    const opened = await page.evaluate((names) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => names.includes(b.innerText.trim()));
      if (btn) {btn.click(); return btn.innerText.trim();}
      return null;
    }, langNames);

    if (!opened) {
      Logger.warn(`[LANG_BUTTON_NOT_FOUND]\t:No language selector button found.`);
      return false;
    }
    Logger.warn(`[LANG_DROPDOWN_OPENED]\t\t:was showing "${opened}"`);

    await sleep(1);

    const clicked = await page.evaluate((name) => {
      const all = document.querySelectorAll('div, span, li, a, button');
      for (const el of all) {
        if (el.innerText?.trim() === name && el.children.length <= 2 && String(el.className || '').includes('cursor-pointer')) {
          el.click();
          return true;
        }
      }
      return false;
    }, displayName);

    if (clicked) {
      Logger.success(`[LANGUAGE_SET]\t\t\t:${displayName}`);
      await sleep(2);
      return true;
    }
    Logger.warn(`[LANGUAGE_OPTION_NOT_FOUND]\t:${displayName}. Using current language.`);
    return false;
  }

  static async #solveProblem(problemName, retried = false) {
    Logger.warn(`[NAVIGATING]\t\t\t:${problemName}`);

    // Check via API if already solved or premium
    try {
      const status = await LeetCodeAPI.fetchProblemStatus(problemName);
      if (status.isPaidOnly) {
        Logger.error(`[PREMIUM_QUESTION]\t\t:${problemName}. Skipping.`);
        await FileManager.setSolvedProblemSet(problemName);
        return;
      }
      if (status.status === 'ac') {
        Logger.error(`[ALREADY_SOLVED]\t\t:${problemName}`);
        await FileManager.setSolvedProblemSet(problemName);
        return;
      }
    } catch (err) {
      Logger.warn(`[API_CHECK_FAILED]\t\t:${problemName} - ${err.message}. Continuing anyway.`);
    }

    const page = await newPage();
    try {
      await page.goto(`https://leetcode.com/problems/${problemName}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    } catch (err) {
      if (!retried) {
        Logger.error(`[NAVIGATION_FAILED]\t\t:${problemName} - ${err.message}`);
        Logger.warn(`[BROWSER_RESET]\t\t: Resetting browser and retrying...`);
        await resetBrowser();
        return this.#solveProblem(problemName, true);
      }
      Logger.error(`[NAVIGATION_FAILED]\t\t:${problemName}. Skipping (retry also failed).`);
      return;
    }

    // Wait for Monaco editor AND LeetCode's boilerplate to finish loading
    // (React creates the model empty, then populates it ~0.5s later)
    try {
      await page.waitForFunction(() => {
        const models = window.monaco?.editor?.getModels();
        if (!models || models.length === 0) return false;
        const value = models[0].getValue();
        return value.includes('class Solution') && value.length > 50;
      }, {timeout: 15000});
    } catch (_) {
      Logger.error(`[EDITOR_NOT_READY]\t\t:${problemName}. Skipping.`);
      return;
    }

    Logger.success(`[SOLVING]\t\t\t:${problemName}`);

    const {code, language} = await FileManager.getProblemDetails(problemName);

    // Switch language if needed
    const currentLangId = await this.#getEditorLangId(page);
    const targetLangId = LANG_IDS[language];
    Logger.warn(`[EDITOR_LANG]\t\t\t: ${currentLangId} (target: ${targetLangId})`);

    if (currentLangId !== targetLangId && targetLangId) {
      const displayName = LANG_DISPLAY[language] || language;
      await this.#switchLanguage(page, targetLangId, displayName);
    }

    // Inject code via Monaco API with retry + post-injection verification
    Logger.warn(`[INJECTING_CODE]\t\t:${problemName}`);
    let injectOk = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      injectOk = await page.evaluate((codeStr) => {
        const models = window.monaco?.editor?.getModels();
        if (!models || models.length === 0) return false;
        models[0].setValue(codeStr);
        return true;
      }, code);

      if (!injectOk) {
        Logger.warn(`[INJECT_RETRY]\t\t\t:${problemName} attempt ${attempt + 1}`);
        await sleep(1);
        continue;
      }

      // Verify injection survived (React may re-render and overwrite)
      await sleep(1);
      injectOk = await page.evaluate((codeStr) => {
        const models = window.monaco?.editor?.getModels();
        if (!models || models.length === 0) return false;
        const current = models[0].getValue();
        return current === codeStr;
      }, code);

      if (injectOk) break;
      Logger.warn(`[INJECT_OVERWRITTEN]\t\t:${problemName} attempt ${attempt + 1}, retrying`);
      await sleep(1);
    }

    if (!injectOk) {
      Logger.error(`[INJECT_FAILED]\t\t:${problemName}. Skipping.`);
      return;
    }

    // Submit
    Logger.warn(`[SUBMITTING]\t\t\t:${problemName}`);
    try {
      await page.click('button[data-e2e-locator="console-submit-button"]');
    } catch (_) {
      try {
        await page.click('button[aria-label="Submit"]');
      } catch (err) {
        Logger.error(`[SUBMIT_FAILED]\t\t:${problemName}. ${err.message}`);
        return;
      }
    }

    // Wait for verdict: Judging appears → disappears → read result
    Logger.warn(`[AWAITING_VERDICT]\t\t:${problemName}`);
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes('Judging'),
        {timeout: 5000}
      ).catch(() => {
        Logger.warn(`[NO_JUDGING_FOUND]\t\t:${problemName}. Submit may not have triggered.`);
      });

      await page.waitForFunction(
        () => !document.body.innerText.includes('Judging'),
        {timeout: 30000}
      );

      const verdict = await page.evaluate(() => {
        const el = document.querySelector('.text-sm.text-sd-muted-foreground');
        if (el) {
          const t = el.innerText?.trim();
          if (t) return t;
        }
        const body = document.body.innerText;
        const keywords = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compile Error'];
        for (const kw of keywords) {
          if (body.includes(kw)) return kw;
        }
        return 'Unknown';
      });

      if (verdict === 'Accepted') {
        Logger.success(`[ACCEPTED]\t\t\t:${problemName}`);
        await FileManager.setSolvedProblemSet(problemName);
      } else {
        Logger.error(`[VERDICT]\t\t\t:${problemName} → ${verdict}`);
      }
    } catch (_) {
      Logger.error(`[VERDICT_TIMEOUT]\t\t:${problemName}. No verdict after 30s.`);
    }

    await sleep(8);
  }

  static async #solveBatch(problemNames, maxCount) {
    const solvedSet = await FileManager.getSolvedProblemSet();
    const unsolvedProblems = problemNames.filter(p => !solvedSet.has(p));
    const skippedCount = problemNames.length - unsolvedProblems.length;
    if (skippedCount > 0) {
      Logger.success(`[SKIPPED]\t\t\t:${skippedCount} already solved`);
    }

    let solved = 0;
    for (const problemName of unsolvedProblems) {
      if (solved >= maxCount) {
        Logger.success(`[REACHED_LIMIT]\t\t\t:${maxCount} problems. Stopping.`);
        break;
      }

      await this.#solveProblem(problemName);
      solved++;

      if (solved % 5 === 0) {
        Logger.warn(`[PAUSE]\t\t\t: Cooling down after ${solved} submissions...`);
        await sleep(15);
      }

      if (solved % 10 === 0) {
        Logger.warn(`[CLEARING_CACHE]\t\t: Flushing browser cache...`);
        await clearBrowserCache();
      }

      if (solved % 50 === 0) {
        Logger.warn(`[BROWSER_RESTART]\t: Restarting browser to free Node.js heap...`);
        await resetBrowser();
      }
    }
  }

  static async run(count = Infinity) {
    Logger.error('<<<< Starting Solver >>>>');
    try {
      const allProblems = await FileManager.getAllProblemsNames();
      Logger.success(`[QUEUED]\t\t\t:${allProblems.length} problems total`);
      await this.#solveBatch(allProblems, count);
    } finally {
      Logger.error('<<<< Exiting Solver >>>>');
      await closeBrowser();
    }
  }
}

export default Solver;
