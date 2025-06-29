import os from 'os'
import * as path from 'path'
import mdfind from './mdfind'

interface App {
  name: string,
  path: string,
  icon: string,
}

const homePaths = ['Applications', 'Library/PreferencePanes'].map(pathname => path.join(os.homedir(), pathname))

const macosAppPaths = [
  '/Applications',  // 安装的应用
  '/System/Applications', // 系统应用
  '/System/Library/PreferencePanes',
  '/System/Library/CoreServices', // 系统工具，如屏幕共享等
  '/Library/PreferencePanes',
  ...homePaths,
]

const supportedTypes = [
  'com.apple.application-bundle',
  'com.apple.systempreference.prefpane',
]

export const canUninstall = (filePath: string) => {
  const canUninstallPathList = [
    '/Applications',
    path.join(os.homedir(), 'Applications')
  ]
  const basename = path.basename(filePath)
  return canUninstallPathList.some(fullPathDir => {
    return path.join(fullPathDir, basename) === filePath
  })
}

/**
 * Build mdfind query
 *
 * @return {String}
 */
const buildQuery = () => (
  supportedTypes.map(type => `kMDItemContentType=${type}`).join('||')
)

const searchAppList = async () => {
  const { stdout, terminate } = mdfind({
    query: JSON.stringify(buildQuery()),
    directories: macosAppPaths,
  })
  let list: any = await stdout
  return list.map((app: App) => {
    const title = app.name.replace(/\.app$/, '')
    return {
      name: `app:${app.path}`,
      subtitle: app.path,
      title,
      icon: `ipublic://public.qwertyyb.com/file-icon?path=${encodeURIComponent(app.path)}&size=48`,
      path: app.path,
      matches: [
        {
          type: 'text',
          keywords: [title.toLowerCase()]
        }
      ],
      actions: [
        {
          name: 'uninstall',
          icon: 'cancel',
          title: '卸载应用',
          shortcuts: 'Meta+Backspace'
        }
      ]
    }
  })
}


export default searchAppList