declare var service: {
  getPlugins: () => AppPlugin[]
}

interface AppPlugin {
  key: string,
  title: string,
  subtitle: string,
  image: string,
  code: string,
  action?: (plugin: AppPlugin) => void,
  children?: AppPlugin[],
  created?: () => any
}