import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import hljsCss from 'highlight.js/styles/atom-one-dark.css?inline'
import githubMarkdownCss from 'github-markdown-css/github-markdown.css?inline'

class MarkdownRender extends HTMLElement {
  static observedAttributes = ["content"];

  marked: Marked | null
  mdRoot: HTMLDivElement | null = null
  constructor() {
    super()
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(githubMarkdownCss);
    const hljsSheet = new CSSStyleSheet()
    hljsSheet.replaceSync(hljsCss)
    const wrapper = this.attachShadow({ mode: 'open' })
    wrapper.adoptedStyleSheets = [sheet, hljsSheet]

    const mdRoot = document.createElement('div')
    mdRoot.classList.add('markdown-body')
    mdRoot.style.background = 'none'
    
    wrapper.appendChild(mdRoot)
    this.mdRoot = mdRoot
    this.marked = new Marked(markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang, info) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        console.log(language)
        return hljs.highlight(code, { language }).value;
      }
    }))
  }
  connectedCallback() {
    console.log("自定义元素添加至页面。");
  }

  disconnectedCallback() {
    console.log("自定义元素从页面中移除。");
    this.marked = null
  }

  adoptedCallback() {
    console.log("自定义元素移动至新页面。");
  }

  async attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    console.log(`属性 ${name} 已变更。`, this.mdRoot, this.marked);
    if (name === 'content' && this.mdRoot && this.marked) {
      this.mdRoot.innerHTML = await this.marked.parse(newValue)
      console.log('dddd', this.mdRoot.innerHTML, newValue)
    }
  }
}

customElements.define('markdown-render', MarkdownRender)