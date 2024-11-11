import { SSE } from 'sse.js'
import { BOTID, TOKEN } from './const'

const crel = <K extends keyof HTMLElementTagNameMap>(tagName: K, attrs?: Partial<Omit<HTMLElementTagNameMap[K], 'style'>> & { style?: Partial<CSSStyleDeclaration> }, ...children: (string | HTMLElement)[]): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tagName)
  // @ts-ignore
  const { style = {}, ...rest } = attrs;
  Object.keys(style).forEach(key => {
    // @ts-ignore
    el.style[key] = style[key]
  })
  Object.keys(rest).forEach(key => {
    // @ts-ignore
    el[key] = attrs[key]
  })
  children.forEach(child => el.append(child))
  return el
}

type ProxyTarget<K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap> = {
  [tagName in K]: (attrs?: Partial<HTMLElementTagNameMap[K]>, ...children: (string | HTMLElement)[]) => HTMLElementTagNameMap[tagName]
}

const el = new Proxy<ProxyTarget>({} as any, {
  get: (target, key) => {
    // @ts-ignore
    return crel.bind(null, key)
  }
})

interface ChatItem {
  id: string,
  messages: { query: string, answer: string }[],
  title: string,
  subtitle?: string,
  prompt?: string,
}

const updateStore = (data: ChatItem[]) => window.localStorage.setItem('store', JSON.stringify(data))
const getStore = (): ChatItem[] => {
  try {
    return JSON.parse(window.localStorage.getItem('store') || '[]') || []
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
      Accept: '*/*'
    },
    payload: JSON.stringify({
      bot_id: BOTID,
      chat_history: chatHistory,
      user: 'mine',
      conversation_id: chatItem.id,
      query,
      stream: true,
      custom_variables: {
        prompt: chatItem.prompt || ''
      }
    })
  })
  let answer = ''
  const handler = (ev: { data: string }) => {
    console.log(ev.data)
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
  div.style.cssText = 'position:relative;height:var(--preview-height);background:none;padding-bottom:60px;box-sizing:border-box;overflow:auto;padding-right:12px'
  div.classList.add('messages')

  chatItem.messages.forEach(async (message) => {
    const h3 = document.createElement('h3')
    h3.textContent = message.query
    const render = document.createElement('markdown-render')
    render.classList.add('answer')
    render.setAttribute('content', message.answer)

    div.appendChild(h3)
    div.appendChild(render)
  })

  const loading = document.createElement('div')
  loading.style.cssText = 'width:20px;height:20px;background:green;border-radius:4px;position:absolute;bottom:20px;left:calc(50% - 10px);display:none'
  loading.title = '停止响应'
  loading.classList.add('loading-btn')

  wrapper.appendChild(div)

  wrapper.appendChild(loading)
  return wrapper
}

const createSettingsDialog = (chat: ChatItem, options: {
  confirm: (values: { title: string, prompt: string }) => void,
  close: () => void,
}) => {
  let values = {
    title: chat.title,
    prompt: chat.prompt || ''
  }
  const dialog = crel('dialog',
    {
      id: 'setting-dialog',
      onclose() {
        options.close()
      },
    },
    crel('form', { method: 'dialog' }, 
      crel('div', { className: 'form-item', style: { display: 'flex', flexDirection: 'column' } },
        crel('label', { htmlFor: 'chat-title', style: { width: '100%' } }, '标题'),
        crel('input', {
          id: 'chat-title',
          value: chat.title,
          style: { width: '100%', },
          onchange: (ev) => {
            values.title = (ev.target as HTMLInputElement).value
          }
        })
      ),
      crel('div', { className: 'form-item', style: { display: 'flex', flexDirection: 'column', marginTop: '12px' } },
        crel('label', { htmlFor: 'chat-prompt', style: { width: '100%' } }, 'prompt'),
        crel('textarea', {
          id: 'chat-prompt',
          style: { width: '360px', height: '200px' },
          onchange: ev => {
            values.prompt = (ev.target as HTMLTextAreaElement).value
          }
        }, chat.prompt || '')
      ),
      crel('div', { className: 'form-item', style: { display: 'flex', justifyContent: 'center', marginTop: '12px' } },
        crel('button', {}, '取消'),
        crel('button', {
          style: {
            marginLeft: '12px'
          },
          onclick() { options.confirm(values) }
        }, '确定')
      )
    )
  )
  return dialog
}

const createAnswerAnimation = (chatItem: ChatItem) => {
  let prev = ''
  let pos = 0
  let interval: ReturnType<typeof setTimeout>

  const toggleLoading = (showLoading = true) => {
    const preview = document.getElementById(chatItem.id);
    if (!preview) return;
    const loadingBtn = preview.querySelector<HTMLElement>('.loading-btn')
    if (loadingBtn) {
      loadingBtn.style.display = showLoading ? 'block' : 'none'
    }
  }

  const renderAnswer = async (answer: string) => {
    const preview = document.getElementById(chatItem.id);
    if (!preview) return;
    const answers = preview.querySelectorAll('.answer')
    const answerEl = answers[answers.length - 1]
    answerEl.setAttribute('content', answer)
    preview.querySelector('.messages')?.scrollTo({ left: 0, top: 9999, behavior: 'smooth' })
  }

  toggleLoading(true)

  return async (answer: string, done: boolean) => {
    if (done) {
      clearInterval(interval)
      renderAnswer(answer)
      toggleLoading(false)
      return
    }

    toggleLoading(true)

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

const addActions = (item: ChatItem) => {
  return {
    ...item,
    actions: [
      {
        name: 'add',
        icon: 'add_box',
        title: '新建会话',
        shortcuts: 'Meta+Enter'
      },
      {
        name: 'settings',
        icon: 'settings',
        title: '设置此会话',
        shortcuts: 'Meta+i'
      },
      {
        name: 'remove',
        icon: 'cancel',
        title: '删除会话',
        shortcuts: 'Meta+Backspace'
      }
    ]
  }
}

const getList = (chatList: ChatItem[], query: string) => {
  return [...chatList]
  .map(item => ({
    ...addActions(item),
    messages: [...item.messages, { query, answer: '' }],
  }))
}

export default {
  search: (keyword: string, setList: any) => {
    console.log('keyword change', keyword, keyword.length)
    setList(getList(chatList, keyword))
  },
  async select(item: ChatItem) {
    const preview = await createPreviewContent(item)
    setTimeout(() => {
      preview.querySelector('.messages')?.scrollTo({ left: 0, top: 99999 })
    }, 0)
    return preview
  },
  async enter(item: any, index: number, query: string) {
    const answerCallback = createAnswerAnimation(item)
    askWithStore(item, (answer, done) => {
      answerCallback(answer, done)
    })
  },
  action(chatItem: any, action: any, query: string) {
    if (action.name === 'remove') {
      chatList = chatList.filter(i => i.id !== chatItem.id)
      updateStore(chatList)
      window.pluginService?.setList(getList(chatList, query))
    } else if (action.name === 'add') {
      const newChatItem = {
        id: 'chat-' + Date.now(),
        messages: [{ query, answer: '' }],
        title: query,
      }
      chatList.unshift(newChatItem)
      window.pluginService?.setList([addActions(newChatItem), ...getList(chatList, query)])
      const answerCallback = createAnswerAnimation(newChatItem)
      askWithStore(newChatItem, (answer, done) => {
        answerCallback(answer, done)
      })
    } else if (action.name === 'settings') {
      const dialog = createSettingsDialog(chatItem, {
        confirm: (values) => {
          chatList = chatList.map(item => {
            if (item.id === chatItem.id) {
              return { ...item, ...values }
            }
            return item
          })
          updateStore(chatList)
          window.pluginService?.setList(getList(chatList, query))
        },
        close: () => {
          dialog.remove()
        }
      })
      document.body.appendChild(dialog)
      dialog.showModal()
    } else if (action.name === 'use') {
      const answerCallback = createAnswerAnimation(chatItem)
      askWithStore(chatItem, (answer, done) => {
        answerCallback(answer, done)
      })
    }
    console.log(chatItem, action)
  }
}