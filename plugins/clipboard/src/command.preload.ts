import { clipboard, nativeImage } from "electron"
import { IPluginCommandListView } from "@public/shared"
import { ContentType } from "./const"

const queryRecordList = async ({ keyword = '' } = {}, { strict = false } = {}) => {
  const sql = keyword ? `SELECT * FROM clipboardHistory where text like $keyword order by lastUseAt DESC limit 30` : `SELECT * FROM clipboardHistory order by lastUseAt DESC limit 30`
  const query = strict ? keyword : `%${keyword}%`
  console.time('query')
  const results = await window.publicApp.db.all(sql, { keyword: query })
  console.timeEnd('query')
  return results.map((item: any) => {
    return {
      ...item,
      content: item.content instanceof Uint8Array ? 'data:image/png;base64,' + Buffer.from(item.content as Uint8Array).toString('base64') : null
    }
  })
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
        icon: item.content ? item.content : './assets/text.png',
        contentValue: item.content ? item.content : item.text,
        contentType: item.contentType,
      }
    })
    setList(list)
  },
  async select(item) {
    let el: HTMLElement
    if (item.contentType === ContentType.image && item.contentValue) {
      const div = document.createElement('div')
      div.style.cssText = 'width:100%;height:var(--preview-height);display:flex;justify-content:center;align-items:center;'
      const img = document.createElement('img')
      img.src = item.contentValue
      img.style.cssText = 'max-width:100%;max-height:100%'
      div.appendChild(img)
      el = div
    } else {
      el = document.createElement('pre')
      el.textContent = item.contentValue
      el.style.cssText = 'border-radius:6px;height:var(--preview-height);overflow:auto;box-sizing:border-box;padding:12px;'
    }
    return el
  },
  async action(item) {
    if (item.contentType === ContentType.text) {
      clipboard.writeText(item.contentValue)
    } else if (item.contentType === ContentType.image) {
      clipboard.writeImage(nativeImage.createFromDataURL(item.contentValue))
    }
    await window.publicApp.mainWindow.hide()
    window.publicApp.keyboard.type('LeftCmd', 'V')
  }
}

export default listView
