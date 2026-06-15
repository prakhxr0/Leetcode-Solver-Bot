### Leetcode Solver Bot
![Leetcode Solver Bot](./assets/banner.jpg)

*"I came, I saw, I copied the optimal solution."* — Julius Caesar, probably

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-headless%20chrome-40B5A4?style=flat-square&logo=googlechrome&logoColor=white)
![C++](https://img.shields.io/badge/C%2B%2B-1465%2B%20solutions-00599C?style=flat-square&logo=cplusplus&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

> Automated LeetCode solution submission bot. Reads C++ solutions from a local archive of **1,465+ problems**, injects them into LeetCode's Monaco editor via Puppeteer, and submits — all from a slick Ink-based terminal UI.

>[!NOTE]
>->no you wont get blocked by leetcode, i have tested it with many accounts. you can inflate your lc profile with extreme ease with this bot. many recruiters use leetcode to screen candidates, and the number matters for the initial screening.

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


---

## ⚡ How It Works
![Workflow Diagram](./assets/architecture.png)
**Phase breakdown:**

1. **Problem selection** — GraphQL checks solved/premium status. Reads solution from `data/problems/` locally.
2. **Browser setup** — Puppeteer with a persistent Chrome profile. Cloudflare sessions survive restarts.
3. **Navigation** — Loads the problem URL, waits on `domcontentloaded` (not `networkidle2` — avoids Cloudflare hangs).
4. **Injection** — Switches editor language to C++ if needed. Injects via Monaco API and verifies with `value.includes('class Solution') && value.length > 50`.
5. **Submission** — Clicks submit, waits for `Judging…` to appear then disappear, reads result.
6. **Rate limiting** — 8s delay between each problem. 15s cooldown every 5th. Time estimate printed before the run starts.



---

## 🚀 Setup

### Prerequisites

- Node.js 18+
- Chrome or Chromium
- WSL2 (optional, for Windows users)

### Installation

**1. Clone & install**
```bash
git clone https://github.com/your-username/leetcode-solver-bot
cd leetcode-solver-bot
npm install
```

**2. Create your `.env`**
```env
USER_EMAIL=your-email@example.com
GOOGLE_CHROME_EXECUTABLE_PATH=/path/to/chrome   # optional — auto-detected if omitted
```

**3. Run**
```bash
npm start
```

A Chrome window will open on first run. Complete the Cloudflare challenge manually — the session is persisted, so you won't have to do this again.

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

---

## ⚠️ Known Limitations

- **Cloudflare** — Requires a one-time manual login. Browser must stay visible (headed mode only).
- **Rate delays** — Fixed cooldowns; may need tuning for different network conditions.
- **Premium problems** — Detected via GraphQL and skipped automatically. Can't solve what you can't see.
- **Session expiry** — Long breaks may require re-authentication.

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
