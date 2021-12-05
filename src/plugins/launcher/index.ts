// import fs from 'fs'
import * as path from 'path'
import { fork, exec } from 'child_process'
import { CommonListItem } from 'src/shared/types/plugin'

interface AppListItem extends CommonListItem{
  path: string,
  icon: string,
}

const getAppList = (() => {
  let childProcess: ReturnType<typeof fork> | undefined
  return (cb) => {
    childProcess?.kill()
    childProcess = fork(
      path.resolve(__dirname, './loadApplications')
    )
    childProcess.on('message', (message) => {
      console.log(message)
      cb(message)
    })
  }
})()

let apps: AppListItem[] = [];

(async () => {
  getAppList((_apps: AppListItem[]) => {
    apps = _apps
  })
})()

const LauncherPlugin = {
  onInput(
    keyword: string
  ) {
    if (!keyword) return globalThis.publicApp.setList([])
    keyword = keyword.toLocaleLowerCase();
    const match = globalThis.publicApp.getUtils().match
    globalThis.publicApp.setList(apps.filter(item => {
      return match([item.code, item.title], keyword)
    }).map(item => {
      return {
        ...item,
        mode: 'no-view'
      }
    }))
  },

  onEnter (app: AppListItem) {
    console.log(app)
    exec(`open -a "${app.path}"`)
    globalThis.publicApp.hideMainWindow()
  }
}

// @ts-ignore
publicPlugin = LauncherPlugin
// @ts-ignore
console.log(globalThis.publicPlugin)
// export default (app: any) => new LauncherPlugin(app)
module.exports = LauncherPlugin
