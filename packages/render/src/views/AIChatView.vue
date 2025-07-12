<template>
  <div class="ai-chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages"
        :key="index"   
        :class="['message', message.role]">
        <div class="message-content" v-html="renderMessage(message)"></div>
      </div>
    </div>
    <div class="chat-input">
      <el-input type="textarea"
        autofocus
        v-model="userInput"
        @keydown="keyDownHandler"
        placeholder="请AI帮你执行任务"
        ref="textarea"
        class="user-input"
        autosize
      ></el-input>
      <el-button @click="sendMessage" class="send-btn" type="primary">发送</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, toRaw, useTemplateRef } from 'vue';
import OpenAI from 'openai';
import MarkdownIt from 'markdown-it';
import { ElInput, ElButton } from 'element-plus';
import { onPageEnter } from '@/router/hooks';
import { isKeyPressed } from '@/utils/keyboard';
import { AI_ASSISTANT_PROMPT, AI_TOOLS_DEFINITIONS, AI_TOOLS } from '@/const';

const props = defineProps<{ query?: string }>()

const md = new MarkdownIt();
const messages = ref<OpenAI.ChatCompletionMessageParam[]>([{
  role: 'system',
  content: AI_ASSISTANT_PROMPT,
}]);
const userInput = ref<string>(props.query || '');
const textarea = useTemplateRef('textarea')
const messagesContainer = ref<HTMLDivElement | null>(null);

const renderedMarkdown = (text: string): string => {
  return md.render(text);
};

const joinContent = (content: string | (OpenAI.Chat.Completions.ChatCompletionContentPartText | OpenAI.ChatCompletionContentPartRefusal)[] | undefined | null) => {
  return Array.isArray(content) ? content.map(item => {
    if (item.type === 'text') return item.text
    return item.refusal
  }).join('\n') : content || '';
}

const renderMessage = (message: OpenAI.ChatCompletionMessageParam) => {
  if (message.role === 'system') {
    return renderedMarkdown(joinContent(message.content));
  }
  if (message.role === 'tool') {
    return `<h4>工具调用结果<h4><p>${message.content}</p>`
  }
  if (message.role === 'assistant') {
    if (message.tool_calls?.length) {
      return message.tool_calls.map((item) => {
        return `<h4 class="tool-call">AI调用工具</h4><pre>${item.function.name}(${item.function.arguments})</pre>`
      }).join('<br />')
    }
    return renderedMarkdown(joinContent(message.content));
  }
  if (message.role === 'user') {
    return message.content;
  }
  return '';
};

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const preferences = window.publicApp.plugin.getPreferenceValues('ai-chat')
const client = new OpenAI({
  apiKey: preferences.apiKey, // 模型APIKey
  baseURL: preferences.baseURL, // 模型API地址
  dangerouslyAllowBrowser: true,
});

const getLastMessage = () => messages.value[messages.value.length - 1]

const runTools = async (toolCall: OpenAI.ChatCompletionMessageToolCall) => {
  if (toolCall.function.name in AI_TOOLS) {
    const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : undefined
    try {
      const result = await AI_TOOLS[toolCall.function.name as keyof typeof AI_TOOLS](args)
      if (!result) return ''
      if (typeof result === 'string') return result
      return JSON.stringify(result)
    } catch (err) {
      console.error(err)
      return `调用${toolCall.function.name}失败，失败信息如下， ${String(err)}`
    }
  } else {
    return `工具${toolCall.function.name}不存在，无法调用`
  }
}

const ask = async () => {
  const completion = await client.chat.completions.create({
    model: preferences.model,
    messages: toRaw(messages.value),
    tools: AI_TOOLS_DEFINITIONS,
    tool_choice: 'auto',
    stream: true,
  }).catch(err => {
    messages.value.push({ role: 'assistant', content: err.message })
    scrollToBottom()
    throw err
  })
  messages.value.push({
    role: 'assistant',
    content: ''
  });
  for await (const chunk of completion) {
    const lastMessage = getLastMessage()
    if (chunk.choices[0]?.finish_reason === 'tool_calls' && lastMessage.role === 'assistant' && 'tool_calls' in lastMessage) {
      // 工具调用的返回结束，可以开始调用工具了
      const results: OpenAI.ChatCompletionToolMessageParam[] = await Promise.all(lastMessage.tool_calls!.map(async toolCall => {
        const result = await runTools(toolCall)
        return { role: 'tool', content: result, tool_call_id: toolCall.id }
      }));
      messages.value.push(...results)
      scrollToBottom();
      // 工具调用完成，再次调用大模型总结结果
      return ask();
    }
    // 工具调用的流式返回
    if (chunk.choices[0]?.delta?.tool_calls) {
      const deltaToolCalls = chunk.choices[0]?.delta?.tool_calls;
      if (deltaToolCalls) {
        const msg = lastMessage as OpenAI.ChatCompletionAssistantMessageParam
        if (!('tool_calls' in lastMessage)) {
          msg.tool_calls = [];
        }
        deltaToolCalls.forEach(deltaToolCall => {
          if (deltaToolCall.index === (lastMessage as OpenAI.ChatCompletionAssistantMessageParam).tool_calls!.length) {
            msg.tool_calls!.push({
              id: deltaToolCall.id!,
              function: {
                name: deltaToolCall.function!.name!,
                arguments: deltaToolCall.function!.arguments || '',
              },
              type: 'function'
            });
          } else {
            msg.tool_calls![deltaToolCall.index].function.arguments += deltaToolCall.function!.arguments || '';
          }
        });
        scrollToBottom();
      }
    }
    // 大模型正常输出
    if (chunk.choices[0]?.delta?.content) {
      const content = chunk.choices[0]?.delta?.content || '';
      lastMessage.content += content;
      scrollToBottom();
    }
  }
};

const sendMessage = async (): Promise<void> => {
  if (!userInput.value.trim()) return;
  
  // Add user message
  scrollToBottom();
  messages.value.push({ role: 'user', content: userInput.value });
  userInput.value = '';
  scrollToBottom();

  // Send message to OpenAI
  await ask();
};

const keyDownHandler = (e: KeyboardEvent | Event) => {
  if (!(e instanceof KeyboardEvent)) return;
  if (isKeyPressed(e, 'Enter')) {
    e.preventDefault()
    sendMessage();
    return;
  }
  if (isKeyPressed(e, 'Escape')) {
    if (userInput.value) {
      userInput.value = ''
      return;
    } else {
      window.publicApp.mainWindow.popToRoot()
      return
    }
  }
}

onPageEnter(async () => {
  await nextTick()
  textarea.value?.focus()
})
</script>

<style scoped lang="scss">
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  margin: 0 auto;
  padding-top: 48px;
}

.chat-messages {
  height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 12px;
  max-width: 80%;
  width: fit-content;
  overflow: auto;
  &.user {
    margin-left: auto;
    .message-content {
    }
  }
  :deep(.message-content) {
    pre {
      white-space: pre-line;
      word-break: break-all;
      font-family:'Courier New', Courier, monospace;
      font-size: 14px;
      font-weight: bold;
    }
    code {
      background-color: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
    }

    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;

      code {
        background-color: transparent;
        padding: 0;
      }
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 0.3em;
      margin-bottom: 0.5em;
    }

    ul, ol {
      padding-left: 20px;
      margin: 10px 0;
    }

    // Dark mode styles
    @media (prefers-color-scheme: dark) {
      code {
        background-color: #2d2d2d;
        color: #e0e0e0;
      }

      pre {
        background-color: #1e1e1e;
        color: #dcdcdc;

        code {
          color: inherit;
        }
      }

      h1, h2, h3, h4, h5, h6 {
        color: #ffffff;
      }

      ul, ol {
        color: #dcdcdc;
      }
    }

  }
}

.message-content {
  padding: 10px;
  border-radius: 6px;
  // background-color: white;
  border: 1px solid light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.2));
}

.chat-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid light-dark(#bbb, rgba(255, 255, 255, 0.2));
}

.user-input {
  flex: 1;
}

.send-btn {
  margin-left: 8px;
}
</style>