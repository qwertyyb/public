import { CommonListItem, PublicPlugin } from 'shared/types/plugin'
import getAppList from './loadApplications'

interface AppListItem extends CommonListItem{
  path: string,
  icon: string,
}

class LauncherPlugin implements PublicPlugin {
  app: any

  constructor(app: any) {
    this.app = app
    // @ts-ignore
    window.requestIdleCallback(() => {
      this.getAppList()
    })
  }

  private apps: AppListItem[] = []

  private getAppList = async () => {
    const apps = await getAppList()
    this.apps = apps
  }

  onInput(
    keyword: string
  ) {
    if (!keyword) return this.app.setList([])
    keyword = keyword.toLocaleLowerCase();
    const match = this.app.getUtils().match
    this.app.setList(this.apps.filter(item => {
      return match([item.code, item.title], keyword)
    }))
  }

  onEnter (app: AppListItem) {
    const { exec } = require('child_process')
    exec(`open -a "${app.path}"`)
  }
}

export default (app: any) => new LauncherPlugin(app)
