import type { IPlugin, IPluginCommandListView as IListViewCommand, IPublicAppPluginAPI, ICommandRegExpMatchData, ICommandTriggerMatchData,
  IPluginCommand as ICommand
 } from '@public/shared'

const { createPluginAPI } = window.PublicApp

const api: IPublicAppPluginAPI = createPluginAPI((process.env as any).PUBLIC_PLUGIN_NAME)

export default api

export { IPlugin, IListViewCommand, ICommandRegExpMatchData, ICommandTriggerMatchData, ICommand }