import { PublicApp, PublicPlugin, CommonListItem } from "shared/types/plugin"

const keywords = [
  {
    key: 'google',
    triggers: ['g', 'google', '谷歌'],
    icon: 'https://img.icons8.com/color/144/000000/google-logo.png',
    title: '谷歌搜索"${keyword}"',
    subtitle: '',
    url: 'https://www.google.com/search?q=${keyword}'
  },
  {
    key: 'baidu',
    triggers: ['b', 'bd', 'baidu', '百度'],
    icon: 'https://img.icons8.com/color/144/000000/baidu.png',
    title: '百度搜索"${keyword}"',
    subtitle: '',
    url: 'https://www.baidu.com/s?wd=${keyword}'
  }
]

const getResultList = (keyword: string): CommonListItem[] => {
  const [first, ...rest] = keyword.split(' ')
  const searchWord = rest.join(' ')
  return keywords
    .filter(searchItem => searchItem
      .triggers.some(trigger => first === trigger)
    )
    .map(searchItem => {
      const item: CommonListItem = {
        key: `plugin:search:${searchItem.key}`,
        icon: searchItem.icon,
        title: searchItem.title.replace(/\$\{keyword\}/g, searchWord),
        subtitle: '',
        onEnter: () => {
          const shell = require('electron').shell
          const url = searchItem.url
            .replace(/\$\{keyword\}/g, encodeURIComponent(searchWord))
          shell.openExternal(url)
        }
      }
      return item;
    })
}

export default (app: PublicApp): PublicPlugin => {
  return {
    title: '搜索',
    subtitle: '快捷搜索',
    icon: '',
    onInput: (keyword, setList) => {
      const resultList = getResultList(keyword)
      setList(resultList)
    }
  }
}