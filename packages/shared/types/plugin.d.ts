type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export interface IActionItem {
  name: string
  icon: string
  title: string
  shortcuts?: string
}

export interface IListItem {
  title: string,
  icon?: string,
  subtitle?: string,
  actions?: IActionItem[]
}

export type IPluginReturn = {
  onInput?: (keyword: string) => void,
  onSelect?: (command: IPluginCommand, keyword: string) => string | undefined | HTMLElement | Promise<string | HTMLElement | undefined>,
  onEnter?: (command: IPluginCommand, keyword: string) => void,
  onAction?: (command: IPluginCommand, action: IActionItem, keyword: string) => void,
} | undefined | null

export type IPlugin = (utils: {
  updateCommands: (commands: IPluginCommandConfig[]) => void,
  showCommands: (commands: IPluginCommandConfig[]) => void,
  enter: (command: IPluginCommand, options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }) => Promise<PortBridge>,
  getPreferences: () => any,
}) => IPluginReturn

export interface ITriggerPluginCommandMatch {
  type: 'trigger'
  triggers: string[]
  title?: string
  subtitle?: string
}
export interface ITextPluginCommandMatch {
  type: 'text'
  keywords: string[]
}

export interface IFullPluginCommandMatch {
  type: 'full'
  title?: string
  subtitle?: string
}

export type IPluginCommandMatch = ITextPluginCommandMatch | ITriggerPluginCommandMatch | IFullPluginCommandMatch

export interface IPluginCommandConfig extends IListItem, Record<string, any> {
  name: string
  mode?: 'listView' | 'none' | 'view'
  matches: IPluginCommandMatch[]
  entry?: string
  preload?: string,
  preferences?: IPreference[]
}

export type IPluginCommand = WithRequired<IPluginCommandConfig, 'name' | 'icon' | 'title' | 'mode' | 'matches'>

export interface IPreference {
  name: string
  title: string
  description?: string
  type: 'text' | 'select',
  required?: boolean,
  default?: string | number | boolean,
  placeholder?: string,

  options?: { value: string | number | boolean, title: string }[]
}

export interface IPluginManifestConfig extends Required<IListItem> {
  name: string
  descript?: string,
  commands?: IPluginCommandConfig[]
  preload?: string,
  preferences?: IPreference[]
}

export interface IPluginManifest extends WithRequired<IPluginCommandConfig, 'name' | 'icon' | 'title'> {
  commands: IPluginCommand[]
}

export interface IRunningPlugin {
  plugin?: IPluginReturn
  path: string
  manifest: IPluginManifest
  commands: IPluginCommand[]
  settings?: IPluginSettings
}

export interface IResultItem extends IListItem, Record<string, any> { }

export interface IPluginCommandListView {
  search?: (keyword: string, setList: (list: IResultItem[]) => void) => void,
  select?: (result: IResultItem, index: number, query: string) => string | HTMLElement | Promise<string> | Promise<HTMLElement>,
  enter?: (result: IResultItem, index: number, query: string) => void,
  action?: (result: IResultItem, index: number, action: IActionItem) => void
}

export interface ICommandSettings {
  alias?: string
  shortcuts?: string
  disabled?: boolean
  preferences?: Record<string, any>
}

export interface IPluginSettings {
  disabled?: boolean,
  commands: Record<string, ICommandSettings | undefined>,
  preferences?: Record<string, string | number | boolean>
}

export type IPluginsSettings = Record<string, IPluginSettings | undefined>