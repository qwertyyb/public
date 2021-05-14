import { CommonListItem, PublicApp, PublicPlugin } from "shared/types/plugin";
import { clipboard } from 'electron'
import * as path from 'path'

const ContentType = {
  text: 'text',
  image: 'image'
}

// @ts-ignore
var db: any = null;

export default (app: PublicApp): PublicPlugin => {
  const { match } = app.getUtils()
  const startListener = (handler: (arg: any) => void) => {
    let lastText: string = '';
    const checkClipboard = () => {
      const text = clipboard.readText()
      if (lastText === text) return;
      lastText = text;
      handler({
        contentType: ContentType.text,
        contentValue: text,
        text: text
      })
    }
    setInterval(checkClipboard, 1000)
  }

  const newItemHandler = async (data: { contentType: string, contentValue: string, text: string }) => {
    const existsItem = await db.history.get({ text: data.text })
    console.log('new Data existsItem', existsItem)
    if (!existsItem) {
      // @ts-ignore
      data.createdAt = Date.now()
      // @ts-ignore
      data.updatedAt = Date.now()
      // @ts-ignore
      data.usedTimes = 1
      await db.history.put(data)
    } else {
      existsItem.updatedAt = Date.now()
      await db.history.update(existsItem.id, existsItem)
    }
  }
  window.addEventListener('load', () => {
    const script = document.createElement('script')
    script.src = 'localfile://' + path.join(__dirname, 'dexie.min.js')
    script.onload = () => {
      // @ts-ignore
      db = new Dexie("clipboard");
      db.version(1).stores({
        history: '++id, contentType, &text, &createdAt, &lastUsedAt, &updatedAt, usedTimes'
      });
      startListener(newItemHandler)
    }
    document.body.append(script)
  })
  return {
    title: '剪切板',
    subtitle: '增强剪切板',
    icon: 'https://img.icons8.com/cute-clipart/64/000000/clipboard.png',
    onInput: async (query: string) => {
      const [trigger, ...rest] = query.split(' ')
      if (!['剪切板', 'clipboard', 'cp'].includes(trigger)) return app.setList([]);
      const keyword = rest.join(' ')
      let list = await db.history.orderBy('updatedAt').reverse().filter((item: any) => {
        return item.text.includes(keyword)
      }).toArray()
      list = list.map((item: any): CommonListItem => {
        return {
          key: `plugin:clipboard:${item.text}`,
          title: item.text,
          subtitle: new Date(item.updatedAt).toLocaleString('zh-TW', { hour12: false }),
          icon: 'https://img.icons8.com/cute-clipart/64/000000/clipboard.png',
          contentValue: item.contentValue
        }
      })
      app.setList(list);
    },
    onEnter: (item) => {
      clipboard.writeText(item.contentValue)
      setTimeout(() => {
        require('robotjs').keyTap("v", ["command"])
      }, 16)
    }
  }
}