import { SSE } from 'sse.js'
import { marked } from 'marked'
import { BOTID, TOKEN } from './const'

window.addEventListener('load', () => {
  // @ts-ignore
  import('github-markdown-css')
})

const selectedInfo: { preview: HTMLDivElement | null } = {
  preview: null
}

const chat = async (query: string) => {
  const response = await window.publicApp.fetch('https://api.coze.cn/open_api/v2/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
      Accept: '*/*'
    },
    body: JSON.stringify({
      bot_id: BOTID,
      user: 'mine',
      query,
      stream: false,
    })
  })
  const json = JSON.parse(response.text)
  return json
}

const streamChat = (query: string) => {
  const source = new SSE('https://api.coze.cn/open_api/v2/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
      Accept: '*/*'
    },
    payload: JSON.stringify({
      bot_id: BOTID,
      user: 'mine',
      query,
      stream: true,
    })
  })
  return source
}

const createPreviewContent = (query: string) => {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:relative;height:100%;'
  wrapper.classList.add('preview-wrapper')

  const div = document.createElement('div')
  div.style.cssText = 'position:relative;height:100%;padding-bottom:60px;box-sizing:border-box;overflow:auto;padding-right:12px'
  div.classList.add('markdown-body')

  const h3 = document.createElement('h3')
  h3.textContent = query
  const section = document.createElement('section')
  section.classList.add('answer')

  const loading = document.createElement('div')
  loading.style.cssText = 'width:20px;height:20px;background:green;border-radius:4px;position:absolute;bottom:20px;left:calc(50% - 10px);display:none'
  loading.title = '停止响应'
  loading.classList.add('loading-btn')

  div.appendChild(h3)
  div.appendChild(section)
  wrapper.appendChild(div)

  wrapper.appendChild(loading)
  return wrapper
}

export default {
  search: window.publicApp.utils.debounce(async (keyword, setList) => {
    setList([
      {
        icon: 'https://lf-coze-web-cdn.coze.cn/obj/coze-web-cn/obric/coze/favicon.1970.png',
        title: keyword,
        query: keyword
      }
    ])
  }),
  select(item) {
    const preview = createPreviewContent(item.query)
    item.preview = preview
    return preview
  },
  async enter(item) {
    const content = item.preview?.querySelector('.answer')
    if (content) {
      content.textContent = '...'
    }
    const loading: HTMLDivElement = item.preview?.querySelector('.loading-btn')
    if (loading) {
      loading.style.display = 'block'
    }

    const source = streamChat(item.query)
    let answer = ''
    const handler = async (e) => {
      const json = JSON.parse(e.data)
      const { event, message } = json;
      if (event === 'message' && message.role === 'assistant' && message.type === 'answer') {
        answer += message.content
        const content = item.preview?.querySelector('.answer')
        content.innerHTML = await marked.parse(answer)
        item.preview?.querySelector('.markdown-body')?.scrollTo({ left: 0, top: 9999, behavior: 'smooth' })
      }
      if (event === 'done' || event === 'error') {
        const loading: HTMLDivElement = item.preview?.querySelector('.loading-btn')
        loading?.parentNode?.removeChild(loading)
        source.removeEventListener('message', handler)
      }
      if (event === 'error') {
        answer += JSON.parse(json.error_information)
      }
    }

    source.addEventListener('message', handler)
  }
}