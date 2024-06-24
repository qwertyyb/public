import type { CommonListItem, PublicApp, PublicPlugin } from "shared/types/plugin"
import * as path from 'path'

const keywords = ['search', 'find', 'files']

export default (app: PublicApp): PublicPlugin => {
  return {
    async onInput (keyword: string) {

      const [first, ...rest] = keyword.split(' ')
      const match = app.getUtils().match(keywords, first)
      const param = rest.join(' ')

      if (!match) return app.setList([])

      const list: CommonListItem[] = []
      list.push({
        key: 'plugin:find:enter',
        title: param ? `搜索文件“${param}”` : '搜索文件',
        icon: 'https://img.icons8.com/?size=100&id=119218&format=png&color=000000',
        onEnter: (item) => {
          app.enter(JSON.parse(JSON.stringify(item)), {
            type: 'listView',
            webPreferences: {
              preload: path.join(__dirname, './preload.js'),
              nodeIntegration: true,
              webSecurity: false,
              allowRunningInsecureContent: false,
              spellcheck: false,
              devTools: true,
              contextIsolation: false,
              backgroundThrottling: false,
              enablePreferredSizeMode: true,
              sandbox: false,
            }
          })
        }
      })
      app.setList(list)
    },
  }
}