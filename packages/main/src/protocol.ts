import { net, session, type Protocol } from "electron"
import { pathToFileURL } from "url"
import { getFileIcon } from '@public/utils/native'
import path from "path"
import log from 'electron-log/main'

export const registerProtocol = (protocol: Protocol, ses?: Electron.Session) => {
  protocol.handle('ipublic', async (request) => {
    log.info('protocol ipublic handler', request.method, request.url, request.body)
    const { host, pathname, searchParams } = new URL(request.url)
    if (request.method === 'GET' && host === 'public.qwertyyb.com' && pathname === '/file-icon') {
      const buffer = await getFileIcon(searchParams.get('path')!, Number(searchParams.get('size')) || 100)
      const maxAge = Number(searchParams.get('max-age')) || 0
      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': `${buffer.byteLength}`,
          'Cache-Control': `max-age=${maxAge}`,
          Date: new Date().toUTCString(),
        }
      })
    }
    if (request.method === 'GET' && host === 'public.qwertyyb.com' && pathname === '/local-file') {
      const path = searchParams.get('path') || ''
      return (ses ?? session.defaultSession).fetch(pathToFileURL(path).toString())
    }
    return new Response(null, {
      status: 400
    })
  })
  protocol.handle('local', (request) => {
    log.info("protocol local handler", request.method, request.url, request.body);
    const filePath = request.url.slice('local://'.length)
    return (ses ?? session.defaultSession).fetch(
      pathToFileURL(path.resolve(__dirname, filePath)).toString()
    );
  })
}