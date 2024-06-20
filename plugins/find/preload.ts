import mdfind from './mdfind'
import { homedir } from 'os'
import * as fs from 'fs'
import * as path from 'path'
import { spawn, type ChildProcess } from 'child_process'
import mdls from './mdls'
import { isBinaryFile } from 'isbinaryfile'

const home = homedir()

const getDirs = () => fs.promises.readdir(home).then(names => names.filter(name => name !== 'Library').map(name => path.join(home, name)))

let excludeLibrary = [home]

getDirs().then(dirs => {
  excludeLibrary = dirs
})

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

const escapeHtml = (str: string) => {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML.replace(/ /g, '&nbsp;'); // 额外处理空格
}

const getWords = async (filePath: string, length = 800) => {
  const fd = await fs.promises.open(filePath)
  const buffer = Buffer.alloc(length)
  await fd.read(buffer)
  fd.close()
  return buffer.toString('utf-8')
}

const attrsLabel = {
  kMDItemDisplayName: '文件名',
  kMDItemPath: '路径',
  kMDItemFSCreationDate: '创建时间',
  kMDItemFSContentChangeDate: '修改时间',
  kMDItemKind: '类型',
  kMDItemFSSize: '大小'
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
          icon: `ipublic://public.qwertyyb.com/file-icon?path=${encodeURIComponent(item.path)}&size=48`,
          title: item.name,
          subtitle: '~' + item.path.substring(home.length),
          data: {
            filePath: item.path
          }
        }))]
        setList(results)
      }
    )
  }),
  async select(item) {
    const attrs = mdls(item.data.filePath, {
      attrs: Object.keys(attrsLabel)
    })
    attrs.kMDItemFSCreationDate = new Date(attrs.kMDItemFSCreationDate).toLocaleString('zh-CN')
    attrs.kMDItemFSContentChangeDate = new Date(attrs.kMDItemFSContentChangeDate).toLocaleString('zh-CN')
    const size = +attrs.kMDItemFSSize
    if (!Number.isNaN(size)) {
      const GB10 = 10 * 1024 * 1024 * 1024
      const MB10 = 10 * 1024 * 1024
      const KB10 = 10 * 1024
      attrs.kMDItemFSSize = size > GB10 ? `${(size / GB10 * 10).toFixed(2)} GB` : size > MB10 ? `${(size / MB10 * 10).toFixed(2)} MB` : size > KB10 ? `${(size / KB10 * 10).toFixed(2)} KB` : `${size} Bytes`
    }
    const isBinary = await isBinaryFile(item.data.filePath).catch(err => true)
    let content = null
    if (!isBinary) {
      content = await getWords(item.data.filePath)
    }
    return `
      <div style="display:flex;flex-direction:column;height:100%">
        <div style="flex:1;overflow:hidden;font-size:14px;background:#dedede;box-sizing:border-box;padding:8px;border-radius:6px;display:flex">
          ${
            isBinary
            ? `<div style="width:100%;height:100%;background-size:cover;background-repeat:no-repeat;background-position:center center;background-image:url(ipublic://public.qwertyyb.com/file-icon?path=${encodeURIComponent(item.data.filePath)}&size=400)"></div>`
            : `<div style="white-space:break-spaces;font-family:Lucida Console, Courier, monospace;word-break:break-all;line-height:1.4">${escapeHtml(content)}</div>`
          }
        </div>
        <ul style="width:100%;margin-top:auto;font-size:14px">
          ${
            Object.keys(attrs)
              .map(key => [null, undefined].includes(attrs[key]) ? '' : `<li style="display:flex;margin-top:8px"><div style="margin-right:20px;white-space:nowrap">${escapeHtml(attrsLabel[key] || key)}</div><div style="margin-left:auto;word-break:break-all">${escapeHtml(attrs[key])}</div></li>`)
              .filter(i => i)
              .join('\n')
          }
        </ul>
      </div>
    `
  },
  enter(item) {
    spawn('open', [item.data.filePath])
  }
}