import * as path from 'path'
import * as fs from 'fs'
// @ts-ignore
import fileIcon from 'file-icon'
import mdfind from './mdfind'

interface App {
  name: string,
  path: string,
  icon: string,
}

const getApplicationSupportPath = () => {
  const path = require('path')
  const subPath = '/cn.qwertyyb.public/launcher'
  const fullPath = path.join(process.env.HOME + '/Library/Application Support/', subPath);
  return fullPath
}

const macosAppPaths = [
  '/System/Applications', // 系统应用
  '/Applications',  // 安装的应用
]


/**
 * List of supported files
 * @type {Array}
 */
const supportedTypes = [
  'com.apple.application-bundle',
  'com.apple.systempreference.prefpane'
]

/**
 * Build mdfind query
 *
 * @return {String}
 */
const buildQuery = () => (
  supportedTypes.map(type => `kMDItemContentType=${type}`).join('||')
)

const getAppList = async () => {
  console.log('start', new Date())
  const { stdout, terminate } = mdfind({
    query: buildQuery(),
    // @ts-ignore
    directories: macosAppPaths,
  })
  const iconDir = path.join(getApplicationSupportPath(), 'launcher-icons')
  if(!await fs.promises.access(iconDir).catch(err => false)) {
    await fs.promises.mkdir(iconDir, { recursive: true })
  }
  let list: any = await stdout
  console.log('mid', new Date())
  list = await Promise.all(list.map(async (app: any) => {
    const iconPath = path.join(iconDir, app.name + '.png')
    // await fileIcon.file(app.path, {
    //   destination: iconPath,
    //   size: 64,
    // })
    return {
      ...app,
      icon: 'localfile://' + iconPath,
    }
  }))
  console.log('end', new Date)
  return list.map((app: App) => {
    const enName = app.path.split('/').pop()?.replace(/\.app$/, '') || ''
    return {
      code: enName,
      subtitle: app.path,
      title: app.name.replace(/\.app$/, ''),
      icon: app.icon,
      path: app.path,
      key: app.path,
    }
  })
}

getAppList().then((applist) => process.send?.(applist))