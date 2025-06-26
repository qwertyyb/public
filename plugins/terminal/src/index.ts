import * as os from 'os'
import { getCurrentPath } from '@public/osx-utils/utils';
import { ICommandTriggerMatchData, IPluginReturn } from '@public/shared';
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
    async onEnter(item, matchData) {
      const directory = (await getCurrentPath()) || os.homedir()
      execCommand(matchData.query || 'pwd', directory)
    }
  }
}