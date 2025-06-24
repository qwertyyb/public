import type { IPluginCommand, IRunningPlugin, IWebviewElement, IWebviewTagAttributes } from "@public/shared";
import type { createBridge } from "@public/utils";
import { shallowRef } from "vue";

export const pluginViewState = shallowRef<{
  plugin: IRunningPlugin,
  command: IPluginCommand,
  query: string
} | {
  options?: IWebviewTagAttributes,
  plugin: IRunningPlugin,
  callback: (options: { webview: IWebviewElement, bridge: ReturnType<typeof createBridge> }) => void }
>()