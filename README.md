# LeetCode Solver Bot

A sophisticated bot that automatically solves LeetCode problems by injecting C++ solutions from a local archive and submitting them through a browser.

## Overview

LeetCode Solver Bot is an automated solution submission system that:
- Reads C++ solutions from a local JSON archive (1,465+ problems)
- Bypasses Cloudflare protection using Puppeteer
- Injects solutions via Monaco API into LeetCode's web interface
- Submits solutions and reads verdicts automatically
- Includes rate limiting and cooldown mechanisms
- Features a sleek Ink-based TUI for user interaction

## Key Features

- **1,465+ C++ Solutions**: Complete archive of C++ solutions in `data/problems/`
- **Cloudflare Bypass**: Headed browser with manual login support
- **Smart Rate Limiting**: 8s between submissions, 15s cooldown every 5 problems
- **TUI Interface**: Beautiful terminal UI with real-time progress tracking
- **Post-Injection Verification**: Ensures code injection success before submission
- **Verdict Detection**: Waits for "Judging..." to appear/disappear to read results

## Architecture

```
src/
├── index.tsx                 # Entry point — renders Ink TUI
├── config.js                 # Environment config from .env
├── tui/
│   ├── App.tsx               # Main app — orchestrates phases
│   └── components/
│       ├── Banner.tsx        # ASCII art + quote
│       ├── LoginPrompt.tsx   # Login instructions
│       ├── ProblemInput.tsx  # Count prompt
│       ├── Progress.tsx      # Live problem feed
│       └── Complete.tsx      # Summary screen
├── browser/
│   └── BrowserManager.js     # Puppeteer singleton
├── api/
│   └── LeetCodeAPI.js        # GraphQL client for problem status
├── core/
│   ├── Authenticator.js      # Login + cookie extraction
│   └── Solver.js             # Language switch, code injection, submit, verdict
├── file/
│   └── FileManager.js        # Read problems/, manage SolvedProblems.json
└── utils/
    ├── Logger.js             # Chalk-based colored output
    └── helpers.js            # sleep()
data/
└── problems/                 # C++ solution JSON files
```

## How It Works

### 1. Problem Selection
- GraphQL API checks if problem is already solved or premium
- Skips solved/premium problems automatically
- Reads from local JSON archive in `data/problems/`

### 2. Browser Setup
- Uses Puppeteer with Chrome (headed for manual Cloudflare login)
- Persists browser profile for session continuity
- Configured with `--no-sandbox` for WSL2 compatibility

### 3. Navigation & Authentication
- Navigates to `leetcode.com/problems/{slug}`
- Waits for LeetCode boilerplate to load (avoids race conditions)
- Requires manual Cloudflare login via TUI prompt

### 4. Solution Injection
- Waits for Monaco editor to be ready
- Switches editor language if not C++
- Injects code via Monaco API with retry + post-injection verification
- Race condition fix: waits for `value.includes('class Solution') && value.length > 50`

### 5. Submission & Verdict
- Clicks submit button
- Waits for "Judging..." to appear then disappear
- Reads verdict from result panel (`.text-sm.text-sd-muted-foreground`)

### 6. Rate Limiting
- 8s delay between submissions
- 15s cooldown every 5 problems
- Time estimate formula: `count × 10s + (count/5) × 15s`

## Technology Stack

### Frontend (TUI)
- **React + TypeScript**: Component-based UI
- **Ink**: Terminal UI library
- **Node.js**: Runtime with `tsx` for JSX transpilation

### Backend (Solver)
- **Puppeteer**: Browser automation
- **Node.js**: JavaScript runtime

### Data
- **JSON Files**: 1,465 C++ solution files in `data/problems/`
- **GraphQL**: LeetCode's API for problem status checks

## Cloudflare Handling

The bot handles Cloudflare protection through:

1. **Headed Browser**: Runs with visible Chrome window for manual login
2. **TUI Prompt**: Displays instructions for Cloudflare login
3. **Session Persistence**: Uses Chrome profile to maintain authenticated state
4. **domcontentloaded**: Uses DOM ready event instead of `networkidle2` to avoid Cloudflare hangs

## Installation & Setup

### Prerequisites
- Node.js 18+
- Chrome/Chromium browser
- WSL2 (optional, for Linux)

### Steps

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with:
   ```env
   USER_EMAIL=your-email@example.com
   GOOGLE_CHROME_EXECUTABLE_PATH=/path/to/chrome
   ```

4. Run the bot:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables
- `USER_EMAIL`: LeetCode account email for authentication
- `GOOGLE_CHROME_EXECUTABLE_PATH`: Path to Chrome executable (optional)

### Rate Limiting
- **Submission Delay**: 8 seconds between submissions
- **Cooldown Period**: 15 seconds every 5 problems
- **Time Estimate**: Calculated based on count and cooldowns

## Development

### Scripts
- `npm start`: Start the TUI application

### Code Style
- TypeScript with ESLint and Prettier
- React components with functional syntax
- Ink for terminal UI components

## Testing

Test results: 10/10 problems solved successfully after all fixes

## Known Issues & Limitations

1. **Cloudflare**: Requires manual login (browser must be visible)
2. **Rate Limiting**: Fixed delays may need adjustment for different network conditions
3. **Premium Problems**: Cannot solve premium LeetCode problems
4. **Session Management**: Requires re-authentication after long breaks

## Contributing

1. Add new C++ solutions to `data/problems/` directory
2. Update `SolvedProblems.json` to track progress
3. Report issues and suggest improvements

## Built By

Created by [PrakharMishra531](https://github.com/PrakharMishra531)

## License

MIT License
