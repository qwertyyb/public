import { shell } from 'electron'
import api, { IPlugin } from '@public/api'
import { getFavicon } from '@public/utils/render'

interface ILink {
  triggers: string[]
  title: string
  url: string
  fallback?: boolean
}

const defaultLinks: ILink[] = [
  {
    triggers: ['gg', 'google'],
    title: 'google',
    url: 'https://www.google.com/search?q=${keyword}',
    fallback: true,
  },
  {
    triggers: ['bd', 'baidu'],
    title: 'baidu',
    url: 'https://www.baidu.com/s?wd=${keyword}',
    fallback: true,
  },
  {
    triggers: ['bing'],
    title: 'bing',
    url: 'https://www.bing.com/search?q=${keyword}',
    fallback: true,
  }
]

const getLinks = (): ILink[] => {
  console.log('getLinks')
  const prfs = api.plugin.getPreferenceValues()
  console.log('prfs', prfs)
  if (Array.isArray(prfs?.links)) return prfs.links
  return defaultLinks
}

const createLinksPlugins: IPlugin = () => {
  return {
    onInput(keyword: string) {
      const [trigger, ...rest] = keyword.split(' ')
      const suffix = rest.join(' ')
      return getLinks().map(link => {
        const match = link.triggers.some(i => i.includes(trigger))
        const query = match ? suffix : keyword
        return {
          name: link.title,
          title: link.title,
          subtitle: query,
          url: link.url.replaceAll('$query', query ? encodeURIComponent(query) : ''),
          icon: getFavicon(link.url),
          score: match ? 0.001 : 0.00001
        }
      })
    },
    onEnter(item, match) {
      const url = item.url
      if (!url) return;
      shell.openExternal(url)
    },
  }
}

export default createLinksPlugins