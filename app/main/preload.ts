import { app, ipcRenderer } from 'electron'
import launcherPlugin from './launcher'

// const lockPlugin: AppPlugin = {
//   key: '1',
//   code: 'lock',
//   title: '锁屏',
//   subtitle: 'lock',
//   image: 'https://via.placeholder.com/50?text=lock',
//   action: () => {
//     const { exec } = window.require('child_process');
//     const os = window.require('os')

//     const lock = (cb?: () => void, customCommands?: any) => {
      
//       const lockCommands = customCommands || {
//         darwin: `open -a ScreenSaverEngine`,
//         win32: 'rundll32.exe user32.dll, LockWorkStation',
//         linux: '(hash gnome-screensaver-command 2>/dev/null && gnome-screensaver-command -l) || (hash dm-tool 2>/dev/null && dm-tool lock)'
//       };
//       const platform = os.platform()
//       if(Object.keys(lockCommands).indexOf(platform) === -1) {
//         throw new Error(`lockscreen doesn't support your platform (${platform})`);
//       } else {
//         exec(lockCommands[platform], (err: string, stdout: string) => {
//           console.log('callback', err, stdout)
//         });
//       }
//     }
//     lock();
//   }
// }

const plugins = [
  // lockPlugin,
  launcherPlugin
]

window.service = {
  getPlugins () {
    return plugins
  }
}
window.PluginManager = {
  getPlugins() {
    return plugins
  },
  handleInput(keyword: string, setResult: (plugin: PublicPlugin, list: CommonListItem[]) => void) {
    const setPluginResult = (plugin: PublicPlugin) => (list: CommonListItem[]) => setResult(plugin, list)
    plugins.forEach(plugin => plugin.onInput(keyword, setPluginResult(plugin)))
  }
}

window.ipcRenderer = ipcRenderer