type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

interface IActionItem {
  name: string
  icon: string
  title: string
  shortcuts?: string
}

interface IListItem {
  title: string,
  icon?: string,
  subtitle?: string,
  actions?: IActionItem[]
}

type IPluginReturn = {
  onInput?: (keyword: string) => void,
  onSelect?: (command: IPluginCommand, keyword: string) => string | HTMLElement | Promise<string> | Promise<HTMLElement>,
  onEnter?: (command: IPluginCommand, keyword: string) => void,
  onAction?: (command: IPluginCommand, action: IActionItem, keyword: string) => void,
} | undefined | null

type IPlugin = (utils: {
  updateCommands: (commands: IPluginCommandConfig[]) => void,
  showCommands: (commands: IPluginCommandConfig[]) => void,
  enter: (command: IPluginCommand, options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }) => void,
}) => IPluginReturn

interface ITriggerPluginCommandMatch {
  type: 'trigger'
  triggers: string[]
  title?: string
  subtitle?: string
}
interface ITextPluginCommandMatch {
  type: 'text'
  keywords: string[]
}

interface IFullPluginCommandMatch {
  type: 'full'
  title?: string
  subtitle?: string
}

type IPluginCommandMatch = ITextPluginCommandMatch | ITriggerPluginCommandMatch | IFullPluginCommandMatch

interface IPluginCommandConfig extends IListItem, Record<string, any> {
  name: string
  mode?: 'listView' | 'none' | 'view'
  matches: IPluginCommandMatch[]
  entry?: string
  preload?: string
}

type IPluginCommand = WithRequired<IPluginCommandConfig, 'name' | 'icon' | 'title' | 'mode' | 'matches'>

interface IPluginManifestConfig extends Required<IListItem> {
  name: string
  descript?: string,
  commands?: IPluginCommandConfig[]
  entry?: string,
}

type IPluginManifest = WithRequired<IPluginCommandConfig, 'name' | 'icon' | 'title'> & {
  commands: IPluginCommand[]
}

interface IRunningPlugin {
  plugin?: IPluginReturn
  path: string
  manifest: Omit<IPluginManifest, 'commands'>
  commands: IPluginCommand[]
  settings?: IPluginSettings
}

interface IResultItem extends IListItem, Record<string, any> { }

interface IPluginCommandListView {
  search?: (keyword: string, setList: (list: IResultItem[]) => void) => void,
  select?: (result: IResultItem, index: number, query: string) => string | HTMLElement | Promise<string> | Promise<HTMLElement>,
  enter?: (result: IResultItem, index: number, query: string) => void,
  action?: (result: IResultItem, index: number, action: IActionItem) => void
}

interface ICommandSettings {
  alias?: string
  shortcuts?: string
  disabled?: boolean
}

interface IPluginSettings {
  disabled?: boolean,
  commands: Record<string, ICommandSettings | undefined>
}

type IPluginsSettings = Record<string, IPluginSettings | undefined>