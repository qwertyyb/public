import { IPlugin, IPluginReturn } from "packages/shared/types"

const createPlugin: IPlugin = () =>  ({
  onEnter(command, keyword) {
    window.publicApp.mainWindow.pushView({ path: '/ai/chat' })
  },
})

export default createPlugin