import * as os from 'os'
import { getCurrentPath } from '@public/osx-utils/utils';
import { runAppleScript } from 'run-applescript'

const execCommand = (command: string, directory: string) => {
  const script = `
  -- Open Terminal and execute the command
  tell application "Terminal"
      activate
      do script "cd " & quoted form of ${JSON.stringify(directory)} & ${JSON.stringify(`; ${command}`)}
  end tell
  `;
  return runAppleScript(script)
}


export default (): IPluginReturn => {
  return {
    async onEnter(item, keyword: string) {
      const directory = (await getCurrentPath()) || os.homedir()
      execCommand(keyword || 'pwd', directory)
      // require('child_process').spawn('osascript', [
      //   '-e',
      //   `tell application "Terminal" to do script ${JSON.stringify(keyword)}
      //   activate application "Terminal"`
      // ]);
    }
  }
}