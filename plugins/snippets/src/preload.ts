import api, { type IPlugin } from '@public/api'

const init = async () => {
  await api.db.run('CREATE TABLE IF NOT EXISTS snippets (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, lastUseAt TEXT NULL DEFAULT NULL, useCount INTEGER DEFAULT 0)')
}

const createSnippetsPlugin: IPlugin = () => {
  init()
  return {
    onEnter(command, matchData) {
      if (command.name === 'create-snippet') {
        api.mainWindow.pushView({ path: '/plugin/snippets/create' })
      }
    },
  }
}

export default createSnippetsPlugin
