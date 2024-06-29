import { withCache } from "@public/utils"
import { type Tab, getOpenTabs, activeTab } from "./service"

const getOpenTabsWithCache = withCache(getOpenTabs)

export default {
  async search(keyword: string, setList) {
    const tabs = await getOpenTabsWithCache()
    setList(tabs.filter(item => item.title.includes(keyword) || item.subtitle.includes(keyword)))
  },
  enter(tab: Tab) {
    activeTab(tab)
  }
}