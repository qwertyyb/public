const { exec } = require('child_process')
const { match } = globalThis.publicApp.getUtils()

const scripts = {
  lock: `
    tell application "System Events" to keystroke "q" using {control down, command down}
  `,
  logout: `
    tell application "System Events"
      start (log out)
    end tell`,
  shutdown: `
    tell application "System Events"
      start (shut down)
    end tell`,
  restart: `
    tell application "System Events"
      start (restart)
    end tell`,
  sleep: `
    tell application "System Events"
      start (restart)
    end tell`
}

const CommandPlugin = {
  onEnter: (item) => {
    const script = scripts[item.name]
    if (!script) return;
    const str = `osascript -e '${script}'`
    // @todo 很慢，需要另寻方案
    console.time('exec command')
    exec(str)
    console.timeEnd('exec command')
  }
}

module.exports = CommandPlugin