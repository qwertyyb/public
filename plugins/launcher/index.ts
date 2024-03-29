// import fs from 'fs'
import * as path from 'path'
import { fork } from 'child_process'
// @ts-ignore
// import fileIcon from 'file-icon'
// import mdfind from './mdfind'
import { CommonListItem, PublicPlugin } from 'shared/types/plugin'

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

class LauncherPlugin implements PublicPlugin {

  icon = 'https://img.icons8.com/fluent/48/000000/apps-tab.png'
  title = '应用启动器'
  subtitle = '快速启动应用'

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
    getAppList((apps: AppListItem[]) => {
      this.apps = apps
    })
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
