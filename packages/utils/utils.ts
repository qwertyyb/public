import { exec } from 'child_process'
import { promisify } from 'util'
import { runAppleScript } from 'run-applescript'

const execAsync = promisify(exec)

const labels = {
  'CFBundleIdentifier': 'bundleIdentifier',
  'CFBundleExecutablePath': 'executablePath',
  'LSDisplayName': 'displayName'
}

interface Application {
  displayName: string
  executablePath: string
  bundleIdentifier: string
}

export const getFrontmostApplication = async (): Promise<Application | undefined | null> => {
  const { stdout } = await execAsync('lsappinfo visibleProcessList')
  const frontmost = await Promise.all(
    stdout.split(' ').slice(0, 1)
    .map(asn => {
      return execAsync(`lsappinfo info ${JSON.stringify(asn)} -only BundleID pid executablePath displayName`).then(({ stdout }) => {
        const lines = stdout.split('\n')
        const values = lines.reduce((acc, line) => {
          const [name, value] = line.split('=')
          if (!name) return acc;
          let label = name
          try {
            label = labels[JSON.parse(name) as keyof typeof labels]
          } catch (err) {
            console.log(err)
          }
          if (label) {
            return {
              ...acc,
              [label]: JSON.parse(value),
            }
          }
          return acc
        }, {}) as Application
        return values
      })
    }
  ))
  return frontmost[0]
}

export const getSelectedPath = async ({ fallbackCurrent = true } = {}) => {
  const script = `
  tell application "Finder"
    set selectedItems to selection
    if (count of selectedItems) is greater than 0 then
        set paths to ""
        repeat with anItem in selectedItems
            set paths to paths & POSIX path of (anItem as alias) & linefeed
        end repeat
    else
        ${fallbackCurrent ? 'set paths to POSIX path of (target of front Finder window as alias) & linefeed' : 'set paths to ""'}
    end if
  end tell
  return paths
  `;
  try {
    const result = await runAppleScript(script)
    return result.split('\n').map(i => i.trim()).filter(i => i)
  } catch (err) {
    return []
  }
}

export const getCurrentPath = async (): Promise<string | undefined | null> => {
  const script = `
  tell application "Finder"
    set paths to POSIX path of (target of front Finder window as alias) & linefeed
  end tell
  return paths
  `;
  try {
    const result = await runAppleScript(script)
    return result.split('\n').map(i => i.trim()).filter(i => i)[0]
  } catch (err) {
    return null
  }
}

export const getChromeCurrentUrl = async () => {
  const script = `
  tell application "Google Chrome"
    if (count of windows) > 0 then
      set currentTab to active tab of front window
      set currentURL to URL of currentTab
      return currentURL
    else
      return ""
    end if
  end tell
  `
  try {
    return await runAppleScript(script)
  } catch (err) {
    return ''
  }
}

export const getSafariCurrentUrl = async () => {
  const script = `
    tell application "Safari"
      if (count of windows) > 0 then
          set currentTab to current tab of front window
          set currentURL to URL of currentTab
          return currentURL
      else
          return ""
      end if
    end tell
  `;

  try {
    return await runAppleScript(script)
  } catch (err) {
    return ''
  }
}