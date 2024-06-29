import { withCache } from "@public/utils"
import { type Tab, getOpenTabs, activeTab, searchHistory } from "./service"

const getOpenTabsWithCache = withCache(getOpenTabs)

searchHistory()

export default {
  async search(keyword: string, setList) {
    if (window.command.name === 'search-tab') {
      const tabs = await getOpenTabsWithCache()
      setList(tabs.filter(item => item.title.includes(keyword) || item.subtitle.includes(keyword)))
    } else {
      const history = await searchHistory(keyword)
      setList(history.map(item => ({ ...item, subtitle: `${item.lastVisited} - ${item.url}`})))
    }
  },
  enter(item: any) {
    if (window.command.name === 'search-tab') {
      activeTab(item as Tab)
    } else {
      require('electron').shell.openExternal(item.url)
    }
  }
}