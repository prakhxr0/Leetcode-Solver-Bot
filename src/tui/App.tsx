import React, {useState, useCallback, useEffect} from 'react';
import {Box, Text} from 'ink';
import Banner from './components/Banner.tsx';
import EmailInput from './components/EmailInput.tsx';
import LoginPrompt from './components/LoginPrompt.tsx';
import ProblemInput from './components/ProblemInput.tsx';
import Progress from './components/Progress.tsx';
import Complete from './components/Complete.tsx';
import Authenticator from '../core/Authenticator.js';
import FileManager from '../file/FileManager.js';
import {closeBrowser, clearBrowserCache, resetBrowser, newPage} from '../browser/BrowserManager.js';
import {setEmail, getUserEmail} from '../config.js';

const PHASES = {
  BANNER: 'banner',
  EMAIL: 'email',
  LOGIN: 'login',
  INPUT: 'input',
  SOLVING: 'solving',
  DONE: 'done',
};

const App = () => {
  const [phase, setPhase] = useState(PHASES.BANNER);
  const [results, setResults] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(Infinity);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // Auto-advance banner after 2s
  useEffect(() => {
    if (phase === PHASES.BANNER) {
      const timer = setTimeout(() => {
        const savedEmail = getUserEmail();
        if (savedEmail && savedEmail !== 'temp@temp.com') {
          setPhase(PHASES.LOGIN);
        } else {
          setPhase(PHASES.EMAIL);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleEmailSubmit = useCallback((submittedEmail) => {
    setPhase(PHASES.LOGIN);
  }, []);

  const handleLoginReady = useCallback(async () => {
    setPhase(PHASES.INPUT);
  }, []);

  const addResult = useCallback((result) => {
    setResults(prev => [...prev, result]);
  }, []);

  const handleCountSubmit = useCallback(async (count) => {
    setLimit(count);
    setStartTime(Date.now());
    setPhase(PHASES.SOLVING);

    try {
      await Authenticator.login();

      const allProblems = await FileManager.getAllProblemsNames();
      setTotalCount(allProblems.length);

      const solvedSet = await FileManager.getSolvedProblemSet();
      const unsolvedProblems = allProblems.filter(p => !solvedSet.has(p));
      const skippedCount = allProblems.length - unsolvedProblems.length;
      if (skippedCount > 0) {
        addResult({name: '_batch', status: 'skipped_summary', detail: `${skippedCount} already solved`});
      }

      let solved = 0;
      for (const problemName of unsolvedProblems) {
        if (solved >= count) break;

        setCurrentProblem(problemName);

        // Check via API
        try {
          const LeetCodeAPI = (await import('../api/LeetCodeAPI.js')).default;
          const status = await LeetCodeAPI.fetchProblemStatus(problemName);
          if (status.isPaidOnly) {
            addResult({name: problemName, status: 'premium'});
            await FileManager.setSolvedProblemSet(problemName);
            continue;
          }
          if (status.status === 'ac') {
            addResult({name: problemName, status: 'skipped', detail: 'already solved'});
            await FileManager.setSolvedProblemSet(problemName);
            continue;
          }
        } catch (_) {}

        // Solve it — emit judging state
        addResult({name: problemName, status: 'judging'});

        try {
          const {newPage: getNewPage} = await import('../browser/BrowserManager.js');
          const {sleep} = await import('../utils/helpers.js');
          const {default: Logger} = await import('../utils/Logger.js');

          let page = await getNewPage();
          try {
            await page.goto(`https://leetcode.com/problems/${problemName}`, {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
          } catch (navErr) {
            Logger.warn(`[BROWSER_RESET]\t\t: Navigation failed, resetting...`);
            await resetBrowser();
            page = await getNewPage();
            await page.goto(`https://leetcode.com/problems/${problemName}`, {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
          }

          // Wait for boilerplate
          await page.waitForFunction(() => {
            const models = window.monaco?.editor?.getModels();
            if (!models || models.length === 0) return false;
            const value = models[0].getValue();
            return value.includes('class Solution') && value.length > 50;
          }, {timeout: 15000});

          const {code, language} = await FileManager.getProblemDetails(problemName);

          // Language switch
          const LANG_IDS = {cpp: 'cpp', java: 'java', python: 'python', python3: 'python3'};
          const LANG_DISPLAY = {cpp: 'C++', java: 'Java', python: 'Python', python3: 'Python3'};
          const currentLangId = await page.evaluate(() => window.monaco?.editor?.getModels()?.[0]?.getLanguageId());
          const targetLangId = LANG_IDS[language];

          if (currentLangId !== targetLangId && targetLangId) {
            const langNames = Object.values(LANG_DISPLAY);
            const opened = await page.evaluate((names) => {
              const btns = Array.from(document.querySelectorAll('button'));
              const btn = btns.find(b => names.includes(b.innerText.trim()));
              if (btn) {btn.click(); return btn.innerText.trim();}
              return null;
            }, langNames);
            if (opened) {
              await sleep(1);
              await page.evaluate((name) => {
                const all = document.querySelectorAll('div, span, li, a, button');
                for (const el of all) {
                  if (el.innerText?.trim() === name && el.children.length <= 2 && String(el.className || '').includes('cursor-pointer')) {
                    el.click(); return;
                  }
                }
              }, LANG_DISPLAY[language]);
              await sleep(2);
            }
          }

          // Inject code
          let injectOk = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            await page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
            await sleep(1);
            injectOk = await page.evaluate((c) => {
              const models = window.monaco?.editor?.getModels();
              return models?.length > 0 && models[0].getValue() === c;
            }, code);
            if (injectOk) break;
            await sleep(1);
          }

          if (!injectOk) {
            addResult({name: problemName, status: 'failed', detail: 'inject failed'});
            continue;
          }

          // Submit
          await page.click('button[data-e2e-locator="console-submit-button"]');

          // Wait for verdict
          await page.waitForFunction(() => document.body.innerText.includes('Judging'), {timeout: 5000}).catch(() => {});
          await page.waitForFunction(() => !document.body.innerText.includes('Judging'), {timeout: 30000});

          const verdict = await page.evaluate(() => {
            const el = document.querySelector('.text-sm.text-sd-muted-foreground');
            return el?.innerText?.trim() || 'Unknown';
          });

          if (verdict === 'Accepted') {
            addResult({name: problemName, status: 'solved'});
            await FileManager.setSolvedProblemSet(problemName);
          } else {
            addResult({name: problemName, status: 'failed', detail: verdict.toLowerCase()});
          }

          solved++;
          if (solved % 5 === 0) await sleep(15);
          if (solved % 10 === 0) await clearBrowserCache();
          if (solved % 50 === 0) await resetBrowser();
          await sleep(8);

        } catch (err) {
          addResult({name: problemName, status: 'failed', detail: err.message.substring(0, 30)});
        }
      }

      setPhase(PHASES.DONE);
    } catch (err) {
      setError(err.message);
    }
  }, [addResult]);

  useEffect(() => {
    return () => { closeBrowser(); };
  }, []);

  return (
    <Box flexDirection="column">
      {(phase === PHASES.BANNER || phase === PHASES.LOGIN || phase === PHASES.EMAIL) && <Banner />}
      {phase === PHASES.EMAIL && <EmailInput onSubmit={handleEmailSubmit} />}
      {phase === PHASES.LOGIN && <LoginPrompt onReady={handleLoginReady} />}
      {phase === PHASES.INPUT && <ProblemInput onSubmit={handleCountSubmit} />}
      {phase === PHASES.SOLVING && (
        <Progress
          results={results}
          total={totalCount}
          current={currentProblem}
          limit={limit}
          startTime={startTime}
        />
      )}
      {phase === PHASES.DONE && <Complete results={results} />}
      {error && (
        <Box marginTop={1} paddingX={2}>
          <Text color="#ff5555">{'Error: '}{error}</Text>
        </Box>
      )}
    </Box>
  );
};

export default App;
