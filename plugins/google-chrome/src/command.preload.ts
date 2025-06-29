import { withCache } from "@public/utils/render"
import { type Tab, getOpenTabs, activeTab, searchHistory } from "./lib/service"

const getOpenTabsWithCache = withCache(getOpenTabs)

searchHistory()

window.publicAppCommand = {
  async search(keyword: string, setList: any) {
    const command = new URL(location.href).searchParams.get('command')
    if (command === 'search-tab') {
      const tabs = await getOpenTabsWithCache()
      setList(tabs.filter(item => item.title.includes(keyword) || item.subtitle.includes(keyword)))
    } else {
      const history = await searchHistory(keyword)
      setList(history.map((item: any) => ({ ...item, subtitle: `${item.lastVisited} - ${item.url}`})))
    }
  },
  action(item: any) {
    const command = new URL(location.href).searchParams.get('command')
    if (command === 'search-tab') {
      activeTab(item as Tab)
    } else {
      require('electron').shell.openExternal(item.url)
    }
  }
}