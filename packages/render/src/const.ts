import type OpenAI from "openai"

export const AI_ASSISTANT_PROMPT = `你是一名Mac电脑专家，擅长使用Bash和AppleScript脚本，只能使用这些工具解决问题。但如果用户的请求是你自身可以通过理解和语言能力完成的(例如翻译、润色、理解、写作等)，你应当直接回答，不调用任何脚本或工具。你不允许仅仅提供口头建议，而是必须使用脚本代码直接获取信息或执行操作。遇到需要用户输入或选择的场景，必须通过AppleScript弹窗完成，不允许使用文字提示。你拥有一系列可调用的工具(function call)，请在需要时选择合适的工具调用。输出的内容要尽量简洁，符合即时反馈的要求。你知道用户通常使用Chrome浏览器，请在涉及网页或文件打开时优先考虑Chrome浏览器。`

export const AI_TOOLS_DEFINITIONS: OpenAI.ChatCompletionTool[] = [
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
  },
  {
    type: 'function',
    function: {
      name: 'getFrontmostApplication',
      description: '获取当前最前方的应用'
    }
  },
  {
    type: 'function',
    function: {
      name: 'getCurrentPath',
      description: '获取Finder当前目录的路径'
    }
  },
  {
    type: 'function',
    function: {
      name: 'getSelectedPath',
      description: '获取Finder当前选中的文件或文件夹的路径'
    }
  },
  {
    type: 'function',
    function: {
      name: 'readClipboard',
      description: '读取剪贴板内容',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'enum',
            enum: ['text', 'html'],
            description: '读取内容的类型，text 或 html'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'paste',
      description: '把内容粘贴到最前方的应用中',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'enum',
            enum: ['text', 'html'],
            description: '粘贴内容的类型，text 或 html'
          },
          content: {
            type: 'string',
            description: '要粘贴的内容'
          }
        }
      }
    }
  }
]

export const AI_TOOLS = {
  runBaseCommand: (options: { command: string }) => window.PublicApp.mainAPI.runBashCommand(options.command),
  runAppleScript: (options: { script: string }) => window.PublicApp.mainAPI.runAppleScript(options.script),
  getCurrentPath: () => window.PublicApp.mainAPI.utils.getCurrentPath(),
  getSelectedPath: () => window.PublicApp.mainAPI.utils.getSelectedPath(),
  getFrontmostApplication: () => window.PublicApp.mainAPI.utils.getFrontmostApplication(),
  readClipboard: (options: { type: 'text' | 'html' }) => {
    return options.type === 'text' ? window.PublicApp.mainAPI.clipboard.readText() : window.PublicApp.mainAPI.clipboard.readHTML()
  },
  paste: (options: { type: 'text' | 'html', content: string }) => {
    return window.PublicApp.mainAPI.clipboard.paste(options.type === 'text' ? options.content : { html: options.content })
  }
}