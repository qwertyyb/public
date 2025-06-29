import { type IPluginReturn } from "@public/shared"
import { createNewWindow } from "./lib/service"

export default (): IPluginReturn => {
  return {
    onEnter(item, keyword) {
      if (item.name === 'create-window') {
        createNewWindow()
      }
    },
  }
}