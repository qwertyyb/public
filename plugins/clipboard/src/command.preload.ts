import { clipboard } from "electron"
import { IPluginCommandListView } from "packages/shared/types"
import textImage from './text.png'
import { join as pathJoin } from 'path'

const queryRecordList = async ({ keyword = '' } = {}, { strict = false } = {}) => {
  const sql = `SELECT * FROM clipboardHistory where text like $keyword order by lastUseAt DESC limit 30`
  const query = strict ? keyword : `%${keyword}%`
  console.time('query')
  const results = await window.publicApp.db.all(sql, { keyword: query })
  console.timeEnd('query')
  return results
}

const listView: IPluginCommandListView = {
  search: async (value: string, setList: (list: any[]) => void) => {
    let list = await queryRecordList({ keyword: value })
    list = list.map((item: any) => {
      const subtitle = `最后使用: ${item.lastUseAt}     创建于: ${item.createdAt}`
      return {
        key: `plugin:clipboard:${item.text}`,
        title: item.text,
        subtitle,
        icon: 'local://' + pathJoin(__dirname, textImage),
        contentValue: item.text
      }
    })
    setList(list)
  },
  async select(item) {
    const pre = document.createElement('pre')
    pre.textContent = item.contentValue
    pre.style.cssText = 'border-radius:6px;height:var(--preview-height);overflow:auto;box-sizing:border-box;padding:12px;'
    return pre
  },
  async action(item) {
    clipboard.writeText(item.contentValue)
    await window.publicApp.mainWindow.hide()
    window.publicApp.keyboard.type('LeftCmd', 'V')
    console.log('item', item)
  }
}

window.publicAppCommand = listView

console.log('ssssss', listView)