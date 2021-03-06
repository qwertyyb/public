import { PublicApp, PublicPlugin, CommonListItem } from "shared/types/plugin"

interface SearchItem {
  key: string,
  triggers: string[],
  icon: string,
  label: string,
  url: string,
  candidateList?: (keyword: string) => Promise<string[]>
}

const keywords: SearchItem[] = [
  {
    key: 'google',
    triggers: ['g', 'gg', 'google', '谷歌'],
    icon: 'https://img.icons8.com/color/144/000000/google-logo.png',
    label: '谷歌搜索',
    url: 'https://www.google.com/search?q=${keyword}',
    candidateList: async (keyword: string): Promise<string[]> => {
      // @ts-ignore
      const res: any = await new Promise((resolve, reject) => $.ajax({
        dataType: 'jsonp',
        jsonp: 'jsonp',
        url: 'https://suggestqueries.google.com/complete/search?client=youtube',
        data: {
          q: keyword
        },
        success: resolve,
        error: resolve
      }))
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
      const res: any = await new Promise((resolve, reject) => $.ajax({
        dataType: 'jsonp',
        jsonp: 'cb',
        url: 'http://suggestion.baidu.com/su',
        data: {
          wd: keyword
        },
        success: resolve,
        error: resolve
      }))
      return Array.isArray(res?.s) && res?.s || []
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
    onEnter: () => {
      const shell = require('electron').shell
      const url = searchItem.url
        .replace(/\$\{keyword\}/g, encodeURIComponent(query))
      shell.openExternal(url)
    }
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

export default (app: PublicApp): PublicPlugin => {
  return {
    title: '搜索',
    subtitle: '快捷搜索',
    icon: 'https://img.icons8.com/nolan/128/search.png',
    onInput: async (keyword, setList) => {
      const resultList = await getResultList(keyword)
      setList(resultList)
    }
  }
}