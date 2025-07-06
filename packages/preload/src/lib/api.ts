import { db, openCommandPreferences, openPluginPreferences, popToRoot, pushView } from './utils';
import { ipcRenderer } from 'electron'
import { IWebview, IWebviewTagAttributes, IPublicAppBaseAPI, IPublicAppMainAPI, IPublicAppPluginAPI } from '@public/shared'
import { runAppleScript } from 'run-applescript'

import { exec } from 'child_process';
import { hanziToPinyin, getFrontmostApplication, getSelectedPath, getCurrentPath } from '@public/utils'
import { type createBridge } from '@public/utils/render';
import { getPlugin } from './manager';
import path from 'path';

const debounce = <F extends (...args: any[]) => any>(fn: F, delay = 200) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => fn(...args), delay)
  }
}

const setItem = async (key: string, value: any) => {
  const doc = await db.get<{ value: any }>(key).catch(err => {
    console.error(err)
    return null
  })
  const data: { _id: string, _rev?: string, value: any } = { value, _id: key }
  if (doc) {
    data._rev = doc._rev
  }
  return db.put(data)
}

const getItem = <T extends any>(key: string) => {
  return db.get<{ value: T }>(key).then(result => result.value).catch(err => {
    console.error(err)
    return null
  })
}

const removeItem = async (key: string) => {
  const doc = await db.get<{ value: any }>(key).catch(err => {
    console.error(err)
    return null
  })
  if (doc) {
    await db.remove(doc)
  }
}

const createBaseAPI = (): IPublicAppBaseAPI => {
  return {
    db: {
      run: (sql: string, params?: Object) =>
        ipcRenderer.invoke("db.run", sql, params),
      all: (sql: string, params?: Object) =>
        ipcRenderer.invoke("db.all", sql, params),
      get: (sql: string, params?: Object) =>
        ipcRenderer.invoke("db.get", sql, params),
    },
    sqlite: {
      run: (dbPath: string, sql: string, params?: Object) =>
        ipcRenderer.invoke("sqlite.run", dbPath, sql, params),
    },
    mainWindow: {
      show: () => ipcRenderer.invoke("mainWindow.show"),
      hide: () => ipcRenderer.invoke("mainWindow.hide"),
      pushView: (options: { path: string; params?: any }) => {
        pushView(options);
      },
      popToRoot(options?: { clearInput?: boolean }) {
        window.dispatchEvent(
          new CustomEvent("pop-to-root", { detail: { ...options } })
        );
      },
    },
    keyboard: {
      type: (...keys: string[]) => ipcRenderer.invoke("keyboard.type", ...keys),
      holdKey: (...keys: string[]) =>
        ipcRenderer.invoke("keyboard.holdkey", ...keys),
      releaseKey: (...keys: string[]) =>
        ipcRenderer.invoke("keyboard.releaseKey", ...keys),
    },
    mouse: {
      getPosition: () => ipcRenderer.invoke("mouse.getPosition"),
      setPosition: (point: { x: number; y: number }) =>
        ipcRenderer.invoke("mouse.setPosition", point),
      move: (point: { x: number; y: number }) =>
        ipcRenderer.invoke("mouse.move", point),
      click: (button: "LEFT" | "MIDDLE" | "RIGHT") =>
        ipcRenderer.invoke("mouse.click", button),
      doubleClick: (button: "LEFT" | "MIDDLE" | "RIGHT") =>
        ipcRenderer.invoke("mouse.doubleClick", button),
      hold: (button: "LEFT" | "MIDDLE" | "RIGHT") =>
        ipcRenderer.invoke("mouse.hold", button),
      release: (button: "LEFT" | "MIDDLE" | "RIGHT") =>
        ipcRenderer.invoke("mouse.release", button),
      drag: (point: { x: number; y: number }) =>
        ipcRenderer.invoke("mouse.drag", point),
      scroll: (point: { x?: number; y?: number }) =>
        ipcRenderer.invoke("mouse.scroll", point),
    },
    fetch: async (...args: Parameters<typeof fetch>) => {
      const result = await ipcRenderer.invoke("fetch", ...args);
      return new Response(result.arrayBuffer, {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
      });
    },
    shortcuts: {
      register: async (shortcuts: string, callback: () => void) => {
        const success = await ipcRenderer.invoke(
          "shortcuts.register",
          shortcuts
        );
        if (!success) {
          throw new Error("注册失败: " + shortcuts);
        }
        ipcRenderer.on(`shortcuts.${shortcuts}`, callback);
      },
      unregister: async (shortcuts: string, callback: () => void) => {
        ipcRenderer.off(`shortcuts.${shortcuts}`, callback);
        await ipcRenderer.invoke("shortcuts.unregister", shortcuts);
      },
    },

    utils: {
      debounce,
      getFrontmostApplication,
      getSelectedPath,
      getCurrentPath,
      hanziToPinyin,
      pathJoin: path.join,
    },
    showToast(options: {
      title?: string;
      icon?: "success" | "error" | "loading" | "none";
      image?: string;
      duration?: number;
    }) {
      const toast = document.createElement("div");
      toast.classList.add("toast");
      toast.textContent = options.title || "";
      toast.style.cssText =
        "position:fixed;left:50%;bottom:10vh;transform:translateX(-50%);background:rgba(0,0,0,8);color:#fff;padding:6px 12px;border-radius:4px;z-index:999";
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, options.duration || 2500);
    },

    showHUD(title, options) {
      ipcRenderer.invoke("showHUD", title, options);
    },

    createView(pluginName: string, options?: IWebviewTagAttributes) {
      return new Promise<{
        webview: IWebview;
        bridge: ReturnType<typeof createBridge>;
      }>((resolve) => {
        pushView({
          path: "/plugin/view",
          params: { plugin: getPlugin(pluginName), options, callback: resolve },
        });
      });
    },

    sendToHost(channel: string, ...args: any[]) {
      return ipcRenderer.sendToHost(channel, ...args);
    },
    onHostMessage(
      channel: string,
      callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void
    ) {
      ipcRenderer.on(channel, callback);
    },
    offHostMessage(channel, callback) {
      ipcRenderer.off(channel, callback);
    },

    storage: {
      setItem,
      getItem,
      removeItem
    },

    runAppleScript(script: string) {
      return runAppleScript(script);
    },
    runBashCommand(command: string) {
      return new Promise((resolve, reject) =>
        exec(command, { encoding: "utf8" }, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            reject(error);
            return;
          }
          resolve(stdout);
          return;
        })
      );
    },
  };
}

const getPreferenceValues = (pluginName: string, commandName?: string) => {
  if (commandName) {
    return getPlugin(pluginName)?.settings?.commands?.[commandName]?.preferences || {}
  }
  return getPlugin(pluginName)?.settings?.preferences || {}
}

const openPreferences = (pluginName: string, commandName?: string) => {
  if (commandName) {
    return openCommandPreferences(pluginName!, commandName)
  }
  return openPluginPreferences(pluginName!)
}

export const createMainAPI = (): IPublicAppMainAPI => {
  const api = createBaseAPI()
  return {
    ...api,
    plugin: {
      openPreferences,
      getPreferenceValues
    }
  }
}

export const createPluginAPI = (plugin: string): IPublicAppPluginAPI => {
  const api = createBaseAPI();
  const getStorageKey = (key: string) => `plugin/${plugin}/${key}`;
  return {
    ...api,
    plugin: {
      openPreferences(commandName) {
        return openPreferences(plugin, commandName);
      },
      getPreferenceValues(commandName) {
        return getPreferenceValues(plugin, commandName);
      },
    },
    storage: {
      setItem(key, value) {
        return setItem(getStorageKey(key), value)
      },
      getItem(key) {
        return getItem(getStorageKey(key))
      },
      removeItem(key) {
        return removeItem(getStorageKey(key))
      },
    }
  };
}
