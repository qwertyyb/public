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
  onSelect?: (command: IPluginCommand, matchData: ICommandMatchData) => string | undefined | HTMLElement | Promise<string | HTMLElement | undefined>,
  onEnter?: (command: IPluginCommand, matchData: ICommandMatchData) => void,
  onAction?: (command: IPluginCommand, action: IActionItem, keyword: string) => void,
} | undefined | null

export type IPlugin = (utils: {
  updateCommands: (commands: IPluginCommandConfig[]) => void,
  showCommands: (commands: IPluginCommandConfig[]) => void,
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

export interface IRegExpPluginCommandMatch {
  type: 'regexp',
  regexp: string
  title?: string
  subtitle?: string
}

export type IPluginCommandMatch = ITextPluginCommandMatch | ITriggerPluginCommandMatch | IFullPluginCommandMatch | IRegExpPluginCommandMatch

interface ICommandBaseMatchData { owner: IRunningPlugin, keyword: string, score: number, query: string }

interface ICommandTextMatchData extends ICommandBaseMatchData { from: 'match', match: ITextPluginCommandMatch, matchData: { keyword: string } }

interface ICommandTriggerMatchData extends ICommandBaseMatchData { from: 'match', match: ITriggerPluginCommandMatch, matchData: { trigger: string, query: string } }

interface ICommandRegExpMatchData extends ICommandBaseMatchData { from: 'match', match: IRegExpPluginCommandMatch, matchData: { matches: RegExpMatchArray } }

interface ICommandFullMatchData extends ICommandBaseMatchData { from: 'match', match: IFullPluginCommandMatch }

interface ICommandHotKeyMatchData extends ICommandBaseMatchData { from: 'hotkey' }

interface ICommandAliasMatchData extends ICommandBaseMatchData { from: 'alias' }

export type ICommandMatchData = ICommandTextMatchData | ICommandTriggerMatchData | ICommandRegExpMatchData | ICommandFullMatchData | ICommandHotKeyMatchData | ICommandAliasMatchData

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
  default?: any,
  placeholder?: string,

  options?: { value: any, label: string }[]
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