export interface PublicApp {
  electronApp: App,
  window: {
    main?: BrowserWindow
  }
}