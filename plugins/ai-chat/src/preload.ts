import { SSE } from 'sse.js'
import { marked } from 'marked'
import { BOTID, TOKEN } from './const'

window.addEventListener('load', () => {
  // @ts-ignore
  import('github-markdown-css')
})

interface ChatItem {
  id: string,
  messages: { query: string, answer: string }[],
  title: string,

  isTemp?: boolean,
}

const updateStore = (data: ChatItem[]) => window.localStorage.setItem('store', JSON.stringify(data))
const getStore = (): ChatItem[] => {
  try {
    return JSON.parse(window.localStorage.getItem('store')).reverse() || []
  } catch(err) {
    return []
  }
}

let chatList = getStore()

const ask = (chatItem: ChatItem, callback: (answer: string, done: boolean) => void) => {
  const { query } = chatItem.messages[chatItem.messages.length - 1]
  const chatHistory = chatItem.messages.slice(0, chatItem.messages.length - 1)
    .map(message => {
      return [
        { role: 'user', content_type: 'text', content: message.query },
        { role: "assistant", type:"answer", content: message.answer, content_type:"text" }
      ]
    })
    .flat()
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
      conversation_id: chatItem.id,
      chat_history: chatHistory,
      query,
      stream: true,
    })
  })
  let answer = ''
  const handler = (ev) => {
    const json = JSON.parse(ev.data)
    const { event, message } = json;
    if (event === 'message' && message.role === 'assistant' && message.type === 'answer') {
      answer += message.content
    }
    if (event === 'error') {
      answer += JSON.parse(json.error_information)
    }
    callback(answer, event === 'error' || event === 'done')
  }
  source.addEventListener('message', handler)
  return source
}

const askWithStore = (chatItem: ChatItem, callback: (answer: string, done: boolean) => void) => {
  return ask(chatItem, (answer, done) => {
    const last = chatItem.messages[chatItem.messages.length - 1]
    last.answer = answer
    chatList = chatList.map(item => item.id === chatItem.id ? chatItem : item)
    updateStore(chatList)
    callback(answer, done)
  })
}

const createPreviewContent = async (chatItem: ChatItem) => {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:relative;height:100%;'
  wrapper.classList.add('preview-wrapper')
  wrapper.setAttribute('id', chatItem.id)

  const div = document.createElement('div')
  div.style.cssText = 'position:relative;height:100%;background:none;padding-bottom:60px;box-sizing:border-box;overflow:auto;padding-right:12px'
  div.classList.add('markdown-body')

  chatItem.messages.forEach(async (message) => {
    const h3 = document.createElement('h3')
    h3.textContent = message.query
    const section = document.createElement('section')
    section.classList.add('answer')
    section.innerHTML = await marked.parse(message.answer)

    div.appendChild(h3)
    div.appendChild(section)
  })

  const loading = document.createElement('div')
  loading.style.cssText = 'width:20px;height:20px;background:green;border-radius:4px;position:absolute;bottom:20px;left:calc(50% - 10px);display:none'
  loading.title = '停止响应'
  loading.classList.add('loading-btn')

  wrapper.appendChild(div)

  wrapper.appendChild(loading)
  return wrapper
}

const createAnswerAnimation = (chatItem: ChatItem) => {
  let prev = ''
  let pos = 0
  let interval: ReturnType<typeof setTimeout>

  const renderAnswer = async (answer: string) => {
    const preview = document.getElementById(chatItem.id);
    if (!preview) return;
    const answers = preview.querySelectorAll('.answer')
    const answerEl = answers[answers.length - 1]
    answerEl.innerHTML = await marked.parse(answer)
    preview.querySelector('.markdown-body')?.scrollTo({ left: 0, top: 9999, behavior: 'smooth' })
  }

  return async (answer: string, done: boolean) => {
    if (done) {
      clearInterval(interval)
      renderAnswer(answer)
      return
    }

    // 有新的数据返回，之前未显示完的数据直接上屏，不再逐个显示
    interval && clearInterval(interval)
    pos = prev.length
    prev = answer

    // 新的数据逐个显示
    interval = setInterval(async () => {
      pos = Math.min(prev.length, pos + 1)
      renderAnswer(answer.substring(0, pos))
    }, 100)
  }
}

export default {
  search: (keyword: string, setList) => {
    console.log('serch', keyword, chatList)
    let results = [...chatList].map(item => ({ ...item, messages: [...item.messages, { query: keyword, answer: '' }]}))
    if (keyword) {
      results = [
        {
          id: 'chat-' + Date.now(),
          title: keyword,
          messages: [{ query: keyword, answer: '...' }],

          isTemp: true,
        },
        ...results
      ]
    }
    console.log('results', results)
    setList(results)
  },
  async select(item: ChatItem) {
    const preview = await createPreviewContent(item)
    setTimeout(() => {
      preview.querySelector('.markdown-body').scrollTo({ left: 0, top: 99999 })
    }, 0)
    return preview
  },
  async enter(item, index, query: string) {
    const { isTemp, ...rest } = item
    let chatItem = { ...rest }
    if (isTemp) {
      // 新创建会话，保存本地
      chatList.unshift(chatItem)
    }
    const answerCallback = createAnswerAnimation(chatItem)
    askWithStore(chatItem, (answer, done) => {
      console.log(answer, done)
      answerCallback(answer, done)
    })
  }
}