import { PublicPlugin } from "shared/types/plugin"
import { createNewWindow } from "./service"

export default (): PublicPlugin => {
  return {
    onEnter(item, keyword) {
      if (item.name === 'create-window') {
        createNewWindow()
      }
    },
  }
}