import fs from 'fs'
import * as path from 'path'
// @ts-ignore
import fileIcon from 'file-icon'

interface App {
  name: string,
  path: string,
  icon: string,
}

const macosAppPaths = [
  '/System/Applications', // 系统应用
  '/Applications',  // 安装的应用
]

class LauncherPlugin implements PublicPlugin {
  constructor() {
    setTimeout(() => {
      this.getApps()
    }, 1000)
  }

  private apps: CommonListItem[] = []

  private getApps = async () => {
    const getMacosApps = async (dirs: string[], level: number = 2): Promise<App[]> => {
      const dirApps: App[][] = await Promise.all(dirs.map(async (dir) => {
          const namelist: string[] = fs.readdirSync(dir);
          // 当前目录下的app
          const appNames = namelist.filter(name => name.endsWith('.app'))
          const apps = await Promise.all(appNames.map(name => ({
            name,
            icon: '1111',
            path: path.join(dir, name)
          })).map(async item => {
            const icon: any = await fileIcon.buffer(item.path).then((buffer: Buffer) => {
              return 
            })
            item.icon = icon
            return item
          }))
          if (level <= 0) return apps
          const dirList = namelist.filter(name => {
            const fullPath = path.join(dir, name)
            if (name.endsWith('.app')) return false
            return fs.statSync(fullPath).isDirectory()
          }).map(dirName => path.join(dir, dirName))
          if (!dirList.length) {
            return apps
          }
          // 子目录下的app
          const subDirApps = await getMacosApps(dirList, level - 1)
          return apps.concat(...subDirApps)
      }));
      return dirApps.flat()
    };
    let list: App[] = await getMacosApps(macosAppPaths)
    const dir = path.join(__dirname, 'launcher-icons')
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    list = await Promise.all(list.map(async app => {
      const iconPath = path.join(dir, app.name + '.png')
      await fileIcon.file(app.path, {
        destination: iconPath,
        size: 64,
      })
      return {
        ...app,
        icon: 'localfile://' + iconPath,
      }
    }))
    this.apps = list.map(app => ({
      code: app.name,
      subtitle: app.path,
      title: app.name,
      icon: app.icon,
      path: app.path,
      onEnter: (app) => {
        const { exec } = require('child_process')
        exec(`open -a "${app.path}"`)
      }
    }))
  }

  onInput(
    keyword: string,
    setResult: (list: CommonListItem[]) => void
  ) {
    if (!keyword) return setResult([])
    setResult(this.apps.filter(item => item.code?.includes(keyword)))
  }
}

export default new LauncherPlugin()
