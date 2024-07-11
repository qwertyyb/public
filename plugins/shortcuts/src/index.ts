import { execFile } from "child_process"
import { promisify } from "util"

const execAsync = promisify(execFile)

const getList = async () => {
  const { stdout, stderr } = await execAsync('shortcuts', ['list'])
  const titles = stdout.split('\n').filter(i => i)
  return titles.map(title => ({
    name: title,
    icon: 'https://img.icons8.com/?size=100&id=MuVeuTIe4EXx&format=png&color=000000',
    title,
    matches: [
      { type: 'text', keywords: [title] } as ITextPluginCommandMatch
    ],
    actions: [
      {
        name: 'view',
        icon: 'visibility',
        title: '查看',
        shortcuts: 'Meta+Enter'
      }
    ]
  }))
}


const shortcutsPlugin: IPlugin = (app) => {
  return {
    async onInput(keyword: string) {
      const list = await getList()
      app.updateCommands(list)
    },
    onEnter(command, keyword) {
      execAsync('shortcuts', ['run', command.title])
    },
    async onAction(command, action, keyword) {
      if (action.name === 'run') {
        execAsync('shortcuts', ['run', command.title])
      } else if (action.name === 'view') {
        execAsync('shortcuts', ['view', command.name])
      }
    }
  }
}

export default shortcutsPlugin

