import type { IPluginCommand, IRunningPlugin } from "@public/shared";
import { shallowRef } from "vue";

export const pluginViewState = shallowRef<{
  plugin: IRunningPlugin,
  command: IPluginCommand,
  query: string
}>()