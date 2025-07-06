import api, { IPlugin } from '@public/api'

const createPlugin: IPlugin = () =>  ({
  onEnter(command, matchData) {
    api.mainWindow.pushView({ path: '/ai/chat', params: { query: matchData.query } })
  },
})

export default createPlugin