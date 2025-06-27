import type { IActionItem, IResultItem } from "@public/shared"

export const query = (keyword: string) => {
  return window.pluginManager?.handleQuery(keyword) || []
}

export const select = (result: IResultItem, keyword: string) => {
  // @ts-ignore
  return window.pluginManager?.handleSelect(result, keyword)
}

export const enter = (result: IResultItem, keyword: string) => {
  // @ts-ignore
  return window.pluginManager?.handleEnter(result)
}

export const action = (result: IResultItem, action: IActionItem, keyword: string) => {
  // @ts-ignore
  return window.pluginManager?.handleAction(result, action, keyword)
}