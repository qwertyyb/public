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

/**
 * Build mdfind query
 *
 * @return {String}
 */
const buildQuery = () => (
  supportedTypes.map(type => `kMDItemContentType=${type}`).join('||')
)

const getAppList = async () => {
  const { stdout, terminate } = mdfind({
    query: JSON.stringify(buildQuery()),
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


export default getAppList