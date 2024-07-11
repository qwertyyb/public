import getAppList from './loadApplications'
import * as os from 'os'
import * as path from 'path'

interface AppListItem extends IListItem {
  path: string,
  icon: string,
}

const canUninstall = (filePath: string) => {
  const canUninstallPathList = [
    '/Applications',
    path.join(os.homedir(), 'Applications')
  ]
  const basename = path.basename(filePath)
  return canUninstallPathList.some(fullPathDir => {
    return path.join(fullPathDir, basename) === filePath
  })
}

class LauncherPlugin {
  app: any

  constructor(app: any) {
    this.app = app
    // @ts-ignore
    window.requestIdleCallback(() => {
      this.getAppList()
    })
  }


  private getAppList = async () => {
    const apps = await getAppList()
    this.app.updateCommands(apps.map(item => ({
      name: `app:${item.path}`,
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      path: item.path,
      matches: [
        {
          type: 'text',
          keywords: [item.title.toLowerCase()]
        }
      ],
      actions: canUninstall(item.path) ? [
        {
          name: 'uninstall',
          icon: 'cancel',
          title: '卸载应用',
          shortcuts: 'Meta+Backspace'
        }
      ] : []
    })))
  }

  onEnter (app: IPluginCommand) {
    const { exec } = require('child_process')
    exec(`open -a "${app.path}"`)
  }
}

export default (app: any) => new LauncherPlugin(app)
