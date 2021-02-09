declare var service: {
  getPlugins: () => PublicPlugin[]
}
declare var PluginManager: {
  getPlugins: () => PublicPlugin[],
  handleInput: (keyword: string, setResult: (plugin: PublicPlugin, list: CommonListItem[]) => void) => void
}
declare var ipcRenderer: EventEmitter
declare var ResizeObserver: any

interface CommonListItem {
  code?: string,
  title: string,
  subtitle: string,
  icon: string,
  onSelect?: () => void,
  onEnter?: (item: CommonListItem, index: number, list: CommonListItem[]) => void,
  [propName: string]: any;
}

interface PublicPlugin {
  onInput: (keyword: string, setResult: (list: CommonListItem[]) => void) => void
}

interface AppPlugin {
  key: string,
  title: string,
  subtitle: string,
  image: string,
  code: string,
  action?: (plugin: AppPlugin) => void,
  children?: AppPlugin[],
  onCreated?: () => any,
  onInput?: () => any,
}

interface Size {
  width: number,
  height: number
}