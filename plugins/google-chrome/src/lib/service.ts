import { runAppleScript } from 'run-applescript'
import * as path from 'path'
import * as fs from 'fs'

export interface Tab {
  icon: string
  title: string
  subtitle: string
  url: string
  windowId: string
  tabIndex: string
}

export const checkAppInstalled = async () => {
  const appInstalled = await runAppleScript(`
set isInstalled to false
try
    do shell script "osascript -e 'exists application \\"Google Chrome\\"'"
    set isInstalled to true
end try

return isInstalled`);
  return appInstalled === "true"
};

export async function activeTab(tab: Tab): Promise<void> {
  await runAppleScript(`
    tell application "Google Chrome"
      activate
      set _wnd to first window where id is ${tab.windowId}
      set index of _wnd to 1
      set active tab index of _wnd to ${tab.tabIndex}
    end tell
    return true
  `);
}

export async function closeActiveTab(tab: Tab): Promise<void> {
  await runAppleScript(`
    tell application "Google Chrome"
      activate
      set _wnd to first window where id is ${tab.windowId}
      set index of _wnd to 1
      set active tab index of _wnd to ${tab.tabIndex}
      close active tab of _wnd
    end tell
    return true
  `);
}

export async function createNewWindow(): Promise<void> {
  await runAppleScript(`
    tell application "Google Chrome"
      make new window
      activate
    end tell
    return true
  `);
}

export async function getOpenTabs({ favicon = false, separator = '~~~' } = {}): Promise<Tab[]> {
  console.log('aaaaa')
  const faviconFormula = favicon
    ? `execute t javascript "document.head.querySelector('link[rel~=icon]')?.href || \`https://www.google.com/s2/favicons?domain=\${encodeURIComponent(location.href)}&sz=128\`;"`
    : '""';

  const script = `
  set _output to ""
  tell application "Google Chrome"
    repeat with w in windows
      set _w_id to get id of w as inches as string
      set _tab_index to 1
      repeat with t in tabs of w
        set _title to get title of t
        set _url to get URL of t
        set _favicon to ${faviconFormula}
        set _output to (_output & _title & "${separator}" & _url & "${separator}" & _favicon & "${separator}" & _w_id & "${separator}" & _tab_index & "\\n")
        set _tab_index to _tab_index + 1
      end repeat
    end repeat
  end tell
  return _output
`

  const openTabs = await runAppleScript(script);

  return openTabs
    .split("\n")
    .filter((line) => line.length !== 0)
    .map((line) => {
      const [title, url, icon, windowId, tabIndex ] = line.split(separator)
      return { title, subtitle: url, url, icon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=128`, windowId, tabIndex }
    });
}

const userLibraryDirectoryPath = () => {
  if (!process.env.HOME) {
    throw new Error("$HOME environment variable is not set.");
  }

  return path.join(process.env.HOME, "Library");
};

const defaultChromeProfilePath = ["Application Support", "Google", "Chrome"];
const DEFAULT_CHROME_PROFILE_ID = "Default";
const getHistoryDbPath = (profile?: string) =>
  path.join(userLibraryDirectoryPath(), ...defaultChromeProfilePath, profile ?? DEFAULT_CHROME_PROFILE_ID, "History")

const whereClauses = (tableTitle: string, terms: string[]) => {
  return terms.map((t) => `(${tableTitle}.title LIKE '%${t}%' OR ${tableTitle}.url LIKE '%${t}%')`).join(" AND ");
};

const getHistoryQuery = (table: string, date_field: string, terms: string[]) =>
  `SELECT id,
            url,
            title,
            datetime(${date_field} /
                     1000000 +
                     (strftime('%s', '1601-01-01')),
                     'unixepoch',
                     'localtime') as lastVisited
     FROM ${table}
     WHERE ${whereClauses(table, terms)}
     ORDER BY ${date_field} DESC LIMIT 30;`

export const searchHistory = async (query?: string) => {
  const terms = query ? query.trim().split(" ") : [""];
  const sql = getHistoryQuery("urls", "last_visit_time", terms);
  const dbPath = getHistoryDbPath(DEFAULT_CHROME_PROFILE_ID);

  if (!fs.existsSync(dbPath)) {
    throw new Error('google chrome is not installed');
  }
  return window.publicApp.sqlite.run(dbPath, sql, {})
}