import { type IListViewCommand } from '@public/api'
// @ts-ignore
import { lookupWordHTML } from '@public/utils/native'
// import { translate } from './tencent-cloud'
import { translate } from './iciba'
import { exec } from 'child_process'

const parser = new DOMParser()

const lookupFromDict = (keyword: string) => {
  const results: any[] = []
  const dictionaries = lookupWordHTML(keyword)
  dictionaries.forEach(d => {
    if (!d.entries.length) return;
    d.entries.forEach(entry => {
      const doc = parser.parseFromString(entry.html, 'application/xhtml+xml')
      Array.from(doc.getElementsByTagName('d:entry')).forEach(item => {
        const title = item.getAttribute('d:title')
        results.push({
          subtitle: d.dictionary,
        })
        Array.from(item.children).forEach(item => {
          if (item.textContent?.trim()) {
            results.push({
              title: item.textContent?.trim(),
              subtitle: d.dictionary,
              icon: './assets/google-translate.png'
            })
          }
        })
      })
    })
  })
  return results
}

const translateUseApple = (keyword: string) => {
  return new Promise<any[]>((resolve, reject) => {
    exec(`shortcuts run "翻译(public专用)" -i ${JSON.stringify(keyword)} | cat`, { encoding: 'utf-8' }, (err, stdout) => {
      if (err) {
        return reject(err)
      }
      if (!stdout) {
        resolve([])
        return
      }
      return resolve([
        {
          subtitle: '翻译'
        },
        {
          title: stdout,
          subtitle: '复制到剪切板',
          icon: './assets/google-translate.png'
        }
      ])
    })
  })
};

const listView: IListViewCommand = {
  search: async (keyword: string, setList: (list: any[]) => void) => {
    console.log('search', keyword)
    if (!keyword) return setList([])
    const results = (await Promise.all([
      translate(keyword).catch(err => {
        console.error(err)
        return [] as any[]
      }),
      translateUseApple(keyword).catch(err => {
        console.error(err)
        return [] as any[]
      })
    ])).flat()
    results.push(...lookupFromDict(keyword))
    setList(results)
  }
}

window.publicAppCommand = listView