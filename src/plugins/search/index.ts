import { resolve } from "dns"
import { PublicApp, PublicPlugin, CommonListItem } from "src/shared/types/plugin"

interface SearchItem {
  key: string,
  triggers: string[],
  icon: string,
  label: string,
  url: string,
  candidateList?: (keyword: string) => Promise<string[]>
}

const jsonp = (() => {
  let id = 0

  const extraResponse = (text: string, callbackValue: string) => {
    const func = new Function(`
      const ${callbackValue} = (value) => value
      return ${text}
    `)
    return func()
  }

  return async (url, callbackName = 'callback') => {
    const callbackValue = 'callback' + (++id)
    const u = new URL(url)
    u.searchParams.set(callbackName, callbackValue)
    const res = await fetch(u.href)
    let text = ''
    if (res.headers.get('content-type')?.includes('gbk')) {
      text = await new Promise(async (resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsText(await res.blob(), 'gbk')
      })
    } else {
      text = await res.text()
    }
    return extraResponse(text, callbackValue)
  }
})()

const keywords: SearchItem[] = [
  {
    key: 'google',
    triggers: ['g', 'gg', 'google', '谷歌'],
    icon: 'https://img.icons8.com/color/144/000000/google-logo.png',
    label: '谷歌搜索',
    url: 'https://www.google.com/search?q=${keyword}',
    candidateList: async (keyword: string): Promise<string[]> => {
      const res = await jsonp(
        'https://suggestqueries.google.com/complete/search?client=youtube&q='+ encodeURIComponent(keyword)
      )
      return res?.[1]?.map((item: string[]) => item[0]) || []
    }
  },
  {
    key: 'baidu',
    triggers: ['b', 'bd', 'baidu', '百度'],
    icon: 'https://img.icons8.com/color/144/000000/baidu.png',
    label: '百度搜索',
    url: 'https://www.baidu.com/s?wd=${keyword}',
    candidateList: async (keyword: string): Promise<string[]> => {
      // @ts-ignore
      const res: any = await jsonp('http://suggestion.baidu.com/su?wd=' + encodeURIComponent(keyword), 'cb')
      return Array.isArray(res?.s) && res?.s || []
    }
  },
  {
    key: 'bing',
    triggers: ['bing', 'by', '必应'],
    icon: 'https://img.icons8.com/color/144/000000/bing.png',
    label: '必应搜索',
    url: 'https://www.bing.com/search?q=${keyword}',
    candidateList: async (keyword: string): Promise<string[]> => {
      const res: any = await fetch('https://api.bing.com/qsonhs.aspx?type=cb&q=' + encodeURIComponent(keyword))
      const body = await res.json();
      const list = body?.AS?.Results?.[0]?.Suggests
      const texts = Array.isArray(list) && list.map(item => item.Txt) || []
      return texts
    }
  }
]

const getCandidateItem = (searchItem: SearchItem, query: string, {
  isCandidate = false,
  index = -1
}): CommonListItem => {
  return {
    key: `plugin:search:${searchItem.key}:${query}:${index}`,
    icon: searchItem.icon,
    title: query || searchItem.label,
    subtitle: isCandidate ? '' : searchItem.label,
    searchUrl: searchItem.url
      .replace(/\$\{keyword\}/g, encodeURIComponent(query))
  }
}

const getCandidateList = async (searchItem: SearchItem, query: string): Promise<CommonListItem[]> => {
  const list: CommonListItem[] = []
  const item: CommonListItem = getCandidateItem(
    searchItem,
    query,
    { isCandidate: false }
  )
  list.push(item)
  if (query && searchItem.candidateList) {
    const candidateStrList = await searchItem.candidateList(query)
    const candidateList = candidateStrList.map(
      (query: string, index: number) => getCandidateItem(
        searchItem,
        query,
        { isCandidate: true, index }
      )
    )
    list.push(...candidateList)
  }
  return list
}

const getResultList = async (keyword: string): Promise<CommonListItem[]> => {
  const [first, ...rest] = keyword.split(' ')
  const searchWord = rest.join(' ')
  const listPromise = keywords
    .filter(searchItem => searchItem
      .triggers.some(trigger => first === trigger)
    )
    .flatMap(async searchItem => {
      const list = await getCandidateList(searchItem, searchWord)
      return list;
    })
  const list = await Promise.all(listPromise)
  const result = list.flat()
  return result
}

const plugin: PublicPlugin = {
  title: '搜索',
  subtitle: '快捷搜索',
  icon: 'https://img.icons8.com/nolan/128/search.png',
  onInput: async (keyword) => {
    const resultList = await getResultList(keyword)
    globalThis.publicApp.setList(resultList)
  },
  onEnter: (item) => {
    const shell = require('electron').shell
    shell.openExternal(item.searchUrl)
  }
}

export default plugin
