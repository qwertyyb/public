import { protocol } from "electron"
import { getFileIcon } from '@public/osx-utils'

export const registerIPublicProtocol = () => {
  protocol.handle('ipublic', async (request) => {
    const { host, pathname, searchParams } = new URL(request.url)
    if (request.method === 'GET' && host === 'public.qwertyyb.com' && pathname === '/file-icon') {
      const buffer = await getFileIcon(searchParams.get('path'), Number(searchParams.get('size')) || 100)
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
  })
}