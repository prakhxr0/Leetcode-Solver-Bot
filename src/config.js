import dotenv from 'dotenv';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

dotenv.config({path: join(ROOT_DIR, '.env')});

const defaultChromePath = process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : '/usr/bin/chromium-browser';

let _userEmail = process.env.USER_EMAIL || 'temp@temp.com';
let _chromeProfilePath = join(ROOT_DIR, `./UserData/${_userEmail}/ProfileData`);
let _userDataPath = join(ROOT_DIR, `./UserData/${_userEmail}/LeetcoderData`);
let _solvedProblemsPath = join(_userDataPath, 'SolvedProblems.json');

// Load saved email from .email file
function loadSavedEmail() {
  try {
    const emailPath = join(ROOT_DIR, '.email');
    const email = fs.readFileSync(emailPath, 'utf-8').trim();
    if (email) {
      _userEmail = email;
      _chromeProfilePath = join(ROOT_DIR, `./UserData/${_userEmail}/ProfileData`);
      _userDataPath = join(ROOT_DIR, `./UserData/${_userEmail}/LeetcoderData`);
      _solvedProblemsPath = join(_userDataPath, 'SolvedProblems.json');
      console.log(`[CONFIG] Loaded email: ${_userEmail}`);
    }
  } catch (_) {}
}

// Save email to .email file
export function saveEmail(email) {
  const emailPath = join(ROOT_DIR, '.email');
  fs.writeFileSync(emailPath, email, 'utf-8');
  console.log(`[CONFIG] Saved email: ${email}`);
}

// Set email dynamically
export function setEmail(email) {
  _userEmail = email;
  _chromeProfilePath = join(ROOT_DIR, `./UserData/${_userEmail}/ProfileData`);
  _userDataPath = join(ROOT_DIR, `./UserData/${_userEmail}/LeetcoderData`);
  _solvedProblemsPath = join(_userDataPath, 'SolvedProblems.json');
}

loadSavedEmail();

export const GOOGLE_CHROME_EXECUTABLE_PATH = process.env.GOOGLE_CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || defaultChromePath;

// Export getter functions instead of const values
export function getUserEmail() { return _userEmail; }
export function getChromeProfilePath() { return _chromeProfilePath; }
export function getUserDataPath() { return _userDataPath; }
export function getSolvedProblemsPath() { return _solvedProblemsPath; }
