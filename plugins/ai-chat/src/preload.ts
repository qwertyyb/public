import { IPlugin } from "packages/shared/types"

const createPlugin: IPlugin = () =>  ({
  onEnter(command, matchData) {
    window.publicApp.mainWindow.pushView({ path: '/ai/chat', params: { query: matchData.query } })
  },
})

export default createPlugin