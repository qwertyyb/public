import type { CoreApp } from "app"
import type { BaseWindow, WebContents } from "electron"
import { getConfig } from "./config"

export const injectWindowEventsToWebContents = (win: BaseWindow, webContents: WebContents) => {
  win.on('hide', () => {
    webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.hide'))`)
  })
  win.on('show', () => {
    webContents.focus()
    webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.show'))`)
  })
  if (!getConfig().isDev) {
    win.on('blur', () => {
      webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.blur'))`)
    })
  }
}

export const dispatchShortcutsEvent = (webContents: WebContents, event: { shortcuts: string }) => {
  webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.shortcuts', { detail: ${JSON.stringify(event)} }))`)
}

export const sendInputEventToPluginView = (coreApp: CoreApp) => {
  coreApp.mainView?.webContents.on('before-input-event', (event, inputEvent) => {
    const keys = {
      ArrowUp: 'Up',
      ArrowLeft: 'Left',
      ArrowRight: 'Right',
      ArrowDown: 'Down'
    }
    coreApp.pluginView?.webContents.sendInputEvent({
      type: inputEvent.type as 'keyDown' | 'keyUp',
      keyCode: keys[inputEvent.key as keyof typeof keys] || inputEvent.key,
      modifiers: inputEvent.modifiers as Electron.InputEvent['modifiers']
    })
  })
}