import { PublicApp, PublicPlugin } from "shared/types/plugin";

const scripts = {
  lock: `
    tell application "System Events" to keystroke "q" using {control down, command down}
  `,
  sleep: `
    tell application "System Events"
      start (sleep)
    end tell
  `,
  logout: `
    tell application "System Events"
      start (log out)
    end tell
  `,
  shutdown: `
    tell application "System Events"
      start (shut down)
    end tell
  `,
  restart: `
    tell application "System Events"
      start (restart)
    end tell
  `
}

export default (app: PublicApp): PublicPlugin => {
  return {
    onEnter: (item) => {
      if (!item.command) return;
      const str = `osascript -e '${scripts[item.name]}'`
      require('child_process').exec(str)
    }
  }
}