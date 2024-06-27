import { shell } from "electron"
import { PublicPlugin } from "shared/types/plugin"

export default (): PublicPlugin => ({
  onEnter (command, query) {
    console.log(command)
    if (command.name === 'act' && Number(query)) {
      shell.openExternal(`https://magic.woa.com/v5/editor/${query}?actId=${query}`)
    }
  }
})
