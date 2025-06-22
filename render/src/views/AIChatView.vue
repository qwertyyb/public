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
      <textarea autofocus v-model="userInput" @keyup.enter="sendMessage" placeholder="请AI帮你执行任务"></textarea>
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, toRaw, onMounted, onBeforeUnmount } from 'vue';
import OpenAI from 'openai';
import MarkdownIt from 'markdown-it';

const systemPrompt = `你是一名Mac电脑专家，擅长使用Bash和AppleScript脚本，只能使用这些工具解决问题。但如果用户的请求是你自身可以通过理解和语言能力完成的(例如翻译、润色、理解、写作等)，你应当直接回答，不调用任何脚本或工具。你不允许仅仅提供口头建议，而是必须使用脚本代码直接获取信息或执行操作。遇到需要用户输入或选择的场景，必须通过AppleScript弹窗完成，不允许使用文字提示。你拥有一系列可调用的工具(function call)，请在需要时选择合适的工具调用。输出的内容要尽量简洁，符合即时反馈的要求。你知道用户通常使用Chrome浏览器，请在涉及网页或文件打开时优先考虑Chrome浏览器。`

const md = new MarkdownIt();
const messages = ref<OpenAI.ChatCompletionMessageParam[]>([{
  role: 'system',
  content: systemPrompt,
}]);
const userInput = ref<string>('');
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

const model = 'doubao-1-5-pro-32k-250115';
const client = new OpenAI({
  apiKey: '', // 模型APIKey
  baseURL: '', // 模型API地址
  dangerouslyAllowBrowser: true,
});

const getLastMessage = () => messages.value[messages.value.length - 1]

const runTools = async (toolCall: OpenAI.ChatCompletionMessageToolCall) => {
  const args = JSON.parse(toolCall.function.arguments)
  try {
    if (toolCall.function.name === 'runBashCommand') {
      return await runBashCommand(args.command);
    } else if (toolCall.function.name === 'runAppleScript') {
      return await runAppleScript(args.script);
    }
  } catch (err) {
    console.error(err)
    return `调用${toolCall.function.name}工具失败, ${err}`
  }
  return `无法调用${toolCall.function.name}工具`
}

const ask = async () => {
  const completion = await client.chat.completions.create({
    model: model,
    messages: toRaw(messages.value),
    tools: tools,
    tool_choice: 'auto',
    stream: true,
  }).catch(err => {
    messages.value.push({ role: 'assistant', content: err.message })
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

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'runBashCommand',
      description: '运行 bash 命令',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: '要运行的 bash 命令'
          }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'runAppleScript',
      description: '运行 AppleScript',
      parameters: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: '要运行的 AppleScript'
          }
        },
        required: ['script']
      }
    }
  }
];

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

const runBashCommand = async (command: string): Promise<string> => {
  // Implement bash command execution logic here
  // This is a mock implementation
  return window.publicApp.runBashCommand(command).catch((err: Error) => {
    console.error(err);
    return `运行命令失败: ${err.message}`;
  });
};

const runAppleScript = async (script: string): Promise<string> => {
  // Implement AppleScript execution logic here
  // This is a mock implementation
  return window.publicApp.runAppleScript(script).catch((err: Error) => {
    console.error(err);
    return `运行脚本失败: ${err.message}`;
  });
};

const searchHandler = (keyword: string) => {
  userInput.value = keyword;
}

onMounted(() => {
  window.publicApp.inputBar.onChange(searchHandler)
})

onBeforeUnmount(() => {
  window.publicApp.inputBar.offChange(searchHandler)
})
</script>

<style scoped lang="scss">
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding-top: var(--nav-height);
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
  &.user {
    margin-left: auto;
    .message-content {
      // background-color: #e3f2fd;
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 1px 2px rgba(255,255,255,0.2);
}

.chat-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid #ddd;
}

textarea {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  height: 40px;
}

button {
  margin-left: 8px;
  padding: 4px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>