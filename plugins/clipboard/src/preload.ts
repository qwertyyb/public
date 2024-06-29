import { clipboard } from "electron"
import type { CommonListItem, PublicApp } from "shared/types/plugin"

const queryRecordList = async ({ keyword = '' } = {}, { strict = false } = {}) => {
  const sql = `SELECT * FROM clipboardHistory where text like $keyword order by lastUseAt DESC`
  const query = strict ? keyword : `%${keyword}%`
  console.time('query')
  const results = await window.publicApp.db.all(sql, { keyword: query })
  console.timeEnd('query')
  return results
}

export default {
  search: async (value: string, setList: (list: any[]) => void) => {
    let list = await queryRecordList({ keyword: value })
    list = list.map((item: any): CommonListItem => {
      const subtitle = `最后使用: ${item.lastUseAt}     创建于: ${item.createdAt}`
      return {
        key: `plugin:clipboard:${item.text}`,
        title: item.text,
        subtitle,
        icon: 'https://img.icons8.com/cute-clipart/64/000000/clipboard.png',
        contentValue: item.text
      }
    })
    setList(list)
  },
  async select(item) {
    return ''
  },
  async enter(item) {
    clipboard.writeText(item.contentValue)
    await window.publicApp.mainWindow.hide()
    window.publicApp.keyboard.type('LeftCmd', 'V')
    console.log('item', item)
  }
}