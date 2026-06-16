import React from 'react';
import {render} from 'ink';
import {execSync} from 'child_process';
import App from './tui/App.tsx';
import {closeBrowser} from './browser/BrowserManager.js';

const cleanup = async () => {
  await closeBrowser();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  try { execSync('pkill -f chromium 2>/dev/null'); } catch (_) {}
});

render(<App />);
