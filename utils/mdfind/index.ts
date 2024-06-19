import { type ChildProcess, exec } from 'child_process'

const REAL_KEYS = {
  kMDItemDisplayName: 'name',
}

const mfindAsync = (args: string) => {
  let childProcess: ChildProcess | null = null
  const result = new Promise<string[]>((resolve, reject) => {
    childProcess = exec(`mdfind ${args}`, (err, result) => {
      if (err) return reject(err)
      const lines = result.split('\0').filter(r => r)
      return resolve(lines.map(line => parseLine(line)))
    })
  })
  return {
    result,
    terminate: () => childProcess?.kill()
  }
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
} = {}) {
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
  ).flat().join(' ')

  const { result } = mfindAsync(`${args}`)

  return result
}

const test = async () => {
  const result = await mdfind({
    query: 'kMDItemContentType=com.apple.application-bundle'
  })
  console.log(result)
}

test()