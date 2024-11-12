import { shell } from "electron"
import { IPluginReturn } from '@public/shared'

export default (): IPluginReturn => ({
  onEnter (command, query) {
    console.log(command)
    if (command.name === 'act' && Number(query)) {
      shell.openExternal(`https://magic.woa.com/v5/editor/${query}?actId=${query}`)
    }
  }
})
