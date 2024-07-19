import searchAppList, { canUninstall } from './loadApplications'


const launcherPlugin: IPlugin = (utils) => {
  window.requestIdleCallback(async () => {
    utils.updateCommands(await searchAppList())
  })
  return ({
    onAction(command, action, keyword) {
      if (action.name === 'uninstall') {
        if (!canUninstall(command.path)) {
          window.alert('无法卸载此应用')
        }
        if (window.confirm('确认删除此应用?')) {
          console.log('confirm uninstall')
        }
      }
    },

    onEnter (app: IPluginCommand) {
      const { exec } = require('child_process')
      exec(`open -a "${app.path}"`)
    }
  })
}

export default launcherPlugin

