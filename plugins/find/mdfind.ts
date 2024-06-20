import { spawn } from 'child_process'

const REAL_KEYS = {
  kMDItemDisplayName: 'name',
}

const mfindAsync = (args: string[], callback: (lines: any[]) => void) => {
  const childProcess = spawn('mdfind', args)
  let line = ''
  childProcess.stdout.on('data', chunk => {
    const str = chunk.toString('utf-8')
    const items = (line + str).split('\0')
    if (!str.endsWith('\0')) {
      line = items.pop()
    }
    callback(items.filter(r => r).map(line => parseLine(line)))
  })
  childProcess.on('error', (code) => {
    console.log('mdfind error', code)
  })
  childProcess.on('exit', () => {
    callback([])
  })
  return childProcess
}

const makeArgs = (array: string[], argName: string) => (
  array.map(item => [argName, item]).flat()
)

const getValue = (item: string) => {
  if (!item || item === '(null)') {
    return null
  } else if (item.startsWith('(\n    "') && item.endsWith('"\n)')) {
    const actual = item.slice(7, -3)
    const lines = actual.split('",\n    "')
    return lines
  }
  return item
}

const parseLine = (line: string) => {
  const attrs = line.split('   ')
  // First attr is always full path to the item
  const filePath = <string>attrs.shift()
  const result: any = {
    path: filePath
  }
  attrs.forEach(attr => {
    const [key, value] = attr.split(' = ')
    result[REAL_KEYS[key] || key] = getValue(value)
  })
  return result
}

export default function mdfind({
  query = '',
  attributes = Object.keys(REAL_KEYS),
  names = [],
  directories = [],
  live = false,
  interpret = false,
  limit = 1024,
} = {}, callback: (list: any[]) => void) {
  const dirArgs = makeArgs(directories, '-onlyin')
  const nameArgs = makeArgs(names, '-name')
  const attrArgs = makeArgs(attributes, '-attr')
  const interpretArgs = interpret ? ['-interpret'] : []
  const queryArgs = query ? [query] : []

  const args = ['-0'].concat(
    dirArgs,
    nameArgs,
    attrArgs,
    interpretArgs,
    live ? ['-live', '-reprint'] : [],
    queryArgs
  ).flat()

  const childProcess = mfindAsync(args, callback)

  return childProcess
}

// const test = async () => {
//   const result = await mdfind({
//     query: 'kMDItemContentType=com.apple.application-bundle'
//   })
//   console.log(result)
// }

// test()