import mdfind from './mdfind'
import { homedir } from 'os'
import * as fs from 'fs'
import * as path from 'path'
import type { ChildProcess } from 'child_process'

const home = homedir()

const excludeLibrary = fs.readdirSync(home).filter(name => name !== 'Library').map(name => path.join(home, name))

let childProcess: ChildProcess | null = null

const debounce = <F extends (...args: any[]) => any>(fn: F) => {
  let timeout = null
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => fn(...args), 200)
  }
}

export default {
  search: debounce((value: string, setList: (list: any[]) => void) => {
    if (!value) {
      setList([])
      return
    }
    if (childProcess && !childProcess?.killed) {
      childProcess.kill()
      childProcess = null
    }
    let results = []
    mdfind(
      {
        query: '',
        directories: excludeLibrary,
        attributes: ['kMDItemDisplayName', 'kMDItemContentType'],
        names: [value]
      },
      (list) => {
        results = [...results, ...list.map(item => ({
          icon: 'https://fakeimg.pl/100',
          title: item.name,
          subtitle: '~' + item.path.substring(home.length),
        }))]
        setList(results)
      }
    )
  }),
  select(item) {
    return JSON.stringify(item)
  },
  enter() {

  }
}