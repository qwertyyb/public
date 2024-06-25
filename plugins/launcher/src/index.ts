import { CommonListItem, PluginCommand, PublicPlugin } from 'shared/types/plugin'
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
    this.app.updateCommands(apps.map(item => ({
      name: `app:${item.path}`,
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      path: item.path,
      matches: [
        {
          type: 'text',
          keywords: [item.title]
        }
      ]
    })))
  }

  onEnter (app: PluginCommand) {
    const { exec } = require('child_process')
    exec(`open -a "${app.path}"`)
  }
}

export default (app: any) => new LauncherPlugin(app)
