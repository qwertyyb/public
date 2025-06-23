import type { IPluginCommand, IRunningPlugin, IWebviewElement, IWebviewTagAttributes } from "@public/shared";
import { shallowRef } from "vue";

export const pluginViewState = shallowRef<{
  plugin: IRunningPlugin,
  command: IPluginCommand,
  query: string
} | { options?: IWebviewTagAttributes, callback: (webview: IWebviewElement) => void }>()