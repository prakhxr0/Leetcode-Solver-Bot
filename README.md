### Leetcode Solver Bot
![Leetcode Solver Bot](./assets/banner.jpg)

*"I came, I saw, I copied the optimal solution."* — Julius Caesar, probably

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-headless%20chrome-40B5A4?style=flat-square&logo=googlechrome&logoColor=white)
![C++](https://img.shields.io/badge/C%2B%2B-1465%2B%20solutions-00599C?style=flat-square&logo=cplusplus&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-prakhxr%2Fleetcode--solver--bot-2496ED?style=flat-square&logo=docker&logoColor=white)

</div>

---

> Automated LeetCode solution submission bot. Reads C++ solutions from a local archive of **1,465+ problems**, injects them into LeetCode's Monaco editor via Puppeteer, and submits — all from a slick Ink-based terminal UI.

>[!NOTE]
>->no you wont get blocked by leetcode, i have tested it with many accounts. you can inflate your lc profile with extreme ease with this bot. many recruiters use leetcode to screen candidates, and the number matters for the initial screening.

>[!TIP]
>docker image is self-contained (~500mb due to chromium) and does not require any additional setup. for the first run, headful browser is required for the initial login step — after login, you can terminate it and start the headless container.

<br/>

<div align="center">
  <img src="./assets/lc-solver-bot.gif" alt="Demo GIF">
</div>

<br/>

---

## ✦ Features

| Feature | Detail |
|---|---|
| **1,465+ C++ solutions** | Local JSON archive — no network call for the solution itself |
| **Cloudflare bypass** | Headed Chrome with persistent session; manual login once, then it's remembered |
| **Monaco API injection** | Writes directly into LeetCode's editor API with retry + post-injection verification |
| **Ink TUI** | React-based terminal UI with live progress, verdicts, and a summary screen |
| **Smart rate limiting** | 8s between submissions, 15s cooldown every 5 problems — time estimate shown upfront |
| **Verdict detection** | Polls "Judging…" state transitions to capture the actual result reliably |
| **Skip logic** | Auto-skips already-solved and premium problems via GraphQL status check |
| **Docker support** | Self-contained container with Chromium; run headless after first login |


---

## ⚡ How It Works
![Workflow Diagram](./assets/architecture.png)
**Phase breakdown:**

1. **Email setup** — TUI asks for your LeetCode email (saved for future runs)
2. **Cloudflare login** — First run opens headed Chrome; complete challenge manually
3. **Problem selection** — GraphQL checks solved/premium status. Reads solution from `data/problems/` locally.
4. **Browser setup** — Puppeteer with a persistent Chrome profile. Sessions survive restarts.
5. **Navigation** — Loads the problem URL, waits on `domcontentloaded` (not `networkidle2` — avoids Cloudflare hangs).
6. **Injection** — Switches editor language to C++ if needed. Injects via Monaco API and verifies with `value.includes('class Solution') && value.length > 50`.
7. **Submission** — Clicks submit, waits for `Judging…` to appear then disappear, reads result.
8. **Rate limiting** — 8s delay between each problem. 15s cooldown every 5th. Time estimate printed before the run starts.



---

## 🚀 Setup

### Docker (Recommended)

No Node.js or Chrome needed on your host. The image ships with Chrome for Testing, all dependencies, and the problem archive — everything works out of the box.

**1. Pull the image**
```bash
docker pull prakhxr/leetcode-solver-bot
```
> [Docker Hub](https://hub.docker.com/repository/docker/prakhxr/leetcode-solver-bot/)

**2. First run — login mode**
```bash
docker run -it \
  -e HEADLESS=false \
  -v $(pwd)/UserData:/app/UserData \
  --network host \
  prakhxr/leetcode-solver-bot
```
A Chrome window opens. Enter your LeetCode credentials and complete any Cloudflare challenge. After login, close the bot — your session is saved to `./UserData/` and reused from here on.

**3. Subsequent runs — headless**
```bash
docker run -it \
  -e HEADLESS=true \
  -v $(pwd)/UserData:/app/UserData \
  prakhxr/leetcode-solver-bot
```

**Or use docker compose (from a cloned repo):**
```bash
# First run — login
HEADLESS=false docker compose run leetcode

# Subsequent runs — headless
HEADLESS=true docker compose run leetcode
```

---

### npm (Local Development)

Requires Node.js 18+ and a local Chrome for Testing download.

**1. Clone & install**
```bash
git clone https://github.com/prakhxr0/Leetcoder.git
cd Leetcoder
npm install
```

**2. Download Chrome for Testing**

The bot uses a project-local Chrome binary so it doesn't interfere with your system browser.

**Linux (x64):**
```bash
mkdir -p .chromium && cd .chromium
curl -sL "https://storage.googleapis.com/chrome-for-testing-public/121.0.6167.85/linux64/chrome-linux64.zip" -o chrome.zip
unzip -q chrome.zip && rm chrome.zip
chmod +x chrome-linux64/chrome
cd ..
```

**macOS (Apple Silicon):**
```bash
mkdir -p .chromium && cd .chromium
curl -sL "https://storage.googleapis.com/chrome-for-testing-public/121.0.6167.85/mac-arm64/chrome-mac-arm64.zip" -o chrome.zip
unzip -q chrome.zip && rm chrome.zip
cd ..
```

**macOS (Intel):**
```bash
mkdir -p .chromium && cd .chromium
curl -sL "https://storage.googleapis.com/chrome-for-testing-public/121.0.6167.85/mac-x64/chrome-mac-x64.zip" -o chrome.zip
unzip -q chrome.zip && rm chrome.zip
cd ..
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path .chromium
cd .chromium
Invoke-WebRequest -Uri "https://storage.googleapis.com/chrome-for-testing-public/121.0.6167.85/win64/chrome-win64.zip" -OutFile chrome.zip
Expand-Archive chrome.zip -DestinationPath .
Remove-Item chrome.zip
cd ..
```

**3. Configure `.env`**

Create a `.env` file in the project root:

```env
USER_EMAIL=your-email@example.com
GOOGLE_CHROME_EXECUTABLE_PATH=/full/path/to/Leetcoder/.chromium/chrome-linux64/chrome
```

> **Linux:** `/home/you/projects/Leetcoder/.chromium/chrome-linux64/chrome`
>
> **macOS:** `.chromium/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
>
> **Windows:** `.chromium\chrome-win64\chrome.exe`

**4. First run (login)**
```bash
npm start
```
A Chrome window opens. Enter your LeetCode credentials and complete any Cloudflare challenge. After login, close the bot — your session is saved in `./UserData/` and reused from here on.

**5. Run headless**
```bash
HEADLESS=true npm start
```

### Platform notes

| Platform | Notes |
|----------|-------|
| **Linux** | Works out of the box with X11 |
| **macOS** | Install XQuartz: `brew install --cask xquartz`, then logout/login |
| **WSL2** | WSLg is built-in on Windows 11, works automatically |
| **Windows** | Use PowerShell or Git Bash |

---

## ⚙️ Configuration

### Rate limiting

| Parameter | Value | Notes |
|---|---|---|
| Submission delay | `8s` | Between every problem |
| Cooldown period | `15s` | Triggered every 5 problems |
| Time estimate | `count × 10s + ⌊count/5⌋ × 15s` | Shown before the run starts |

### Adding solutions

Drop new solutions into `data/problems/` as JSON files following the existing format. The `SolvedProblems.json` tracker is updated automatically after each successful submission.

---

## 🛠️ Tech Stack

<details>
<summary><b>Frontend (TUI)</b></summary>

- **React** — Component model for terminal UI
- **Ink** — Renders React components into the terminal
- **TypeScript** — Type safety across TUI components
- **tsx** — JSX transpilation without a build step

</details>

<details>
<summary><b>Backend (Solver)</b></summary>

- **Puppeteer** — Browser automation + Monaco API access
- **Node.js** — Runtime for the entire bot
- **GraphQL** — LeetCode's own API for problem status checks

</details>

<details>
<summary><b>Data</b></summary>

- **JSON files** — 1,465 C++ solution files in `data/problems/`
- **SolvedProblems.json** — Local tracker to avoid re-submission

</details>

<details>
<summary><b>Deployment</b></summary>

- **Docker** — Self-contained container with Chromium
- **Docker Compose** — Easy setup and configuration
- **Volumes** — Persistent Chrome profile and solved problems

</details>

---

## ⚠️ Known Limitations

- **Cloudflare** — Requires a one-time manual login in headed mode. After that, headless mode works.
- **Rate delays** — Fixed cooldowns; may need tuning for different network conditions.
- **Premium problems** — Detected via GraphQL and skipped automatically. Can't solve what you can't see.
- **Session expiry** — Long breaks may require re-authentication.
- **Docker image size** — ~500MB-1GB due to bundled Chromium and problem archive.

---

## 🤝 Contributing

1. Add new C++ solutions to `data/problems/`
2. Follow the existing JSON format
3. Open a PR with what you added

---

<div align="center">

MIT License · built with Puppeteer, Ink, and zero remorse

*If this saved your grind, leave a ⭐*

</div>
