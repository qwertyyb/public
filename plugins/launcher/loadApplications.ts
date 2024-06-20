import * as fs from 'fs'
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
  '/System/Library/CoreServices/Applications', // 系统工具，如屏幕共享等
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

const getAppList = async ({ onlyNewAppCreateIcon = false } = {}) => {
  const { stdout, terminate } = mdfind({
    query: buildQuery(),
    directories: macosAppPaths,
  })
  let list: any = await stdout
  return list.map((app: App) => {
    const enName = app.path.split('/').pop()?.replace(/\.app$/, '') || ''
    return {
      code: enName,
      subtitle: app.path,
      title: app.name.replace(/\.app$/, ''),
      icon: `ipublic://public.qwertyyb.com/file-icon?path=${encodeURIComponent(app.path)}&size=48`,
      path: app.path,
      key: app.path,
    }
  })
}


getAppList({
  onlyNewAppCreateIcon: true
}).then((applist) => process.send?.(applist))

fs.watch('/Applications', { persistent: true }, (() => {
  let timeout = null
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      getAppList({
        onlyNewAppCreateIcon: true
      }).then((applist) => process.send?.(applist))
    }, 500)
  }
})())