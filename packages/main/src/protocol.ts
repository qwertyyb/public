import { net, type Protocol } from "electron"
import { pathToFileURL } from "url"
import { getFileIcon } from '@public/utils'

export const registerIPublicProtocol = (protocol: Protocol) => {
  protocol.handle('ipublic', async (request) => {
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
      return net.fetch(pathToFileURL(path).toString())
    }
    return new Response(null, {
      status: 400
    })
  })
}