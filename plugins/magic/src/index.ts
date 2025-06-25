import { shell } from "electron"
import { IPluginReturn } from '@public/shared'

export default (): IPluginReturn => ({
  onEnter (command, query) {
    if (!Number(query)) return
    if (command.name === 'editor') {
      shell.openExternal(`https://magic.woa.com/v5/editor/${query}?actId=${query}`)
      return
    }
    if (command.name === 'mod') {
      shell.openExternal(`https://magic.woa.com/v5/act/view/${query}`)
      return
    }
  }
})
