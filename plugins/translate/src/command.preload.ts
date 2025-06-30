import { type IPluginCommandListView } from '@public/shared'
// @ts-ignore
import { lookupWordHTML } from '@public/utils/native'
// import { translate } from './tencent-cloud'
import { translate } from './iciba'

const parser = new DOMParser()

const listView: IPluginCommandListView = {
  search: async (keyword: string, setList: (list: any[]) => void) => {
    console.log('search', keyword)
    if (!keyword) return setList([])
    const results = await translate(keyword)
    console.log(results)
    const dictionaries = lookupWordHTML(keyword)
    dictionaries.forEach(d => {
      if (!d.entries.length) return;
      d.entries.forEach(entry => {
        const doc = parser.parseFromString(entry.html, 'application/xhtml+xml')
        Array.from(doc.getElementsByTagName('d:entry')).forEach(item => {
          const title = item.getAttribute('d:title')
          results.push({
            // title,
            subtitle: d.dictionary,
            // icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
          })
          Array.from(item.children).forEach(item => {
            if (item.textContent?.trim()) {
              results.push({
                title: item.textContent?.trim(),
                subtitle: d.dictionary,
                icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
              })
            }
          })
        })
      })
    })
    setList(results)
  }
}

window.publicAppCommand = listView