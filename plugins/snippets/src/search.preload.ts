import { clipboard } from 'electron'
import api, { IListViewCommand } from '@public/api'

interface ISnippet {
  id: number,
  title: string,
  content: string,
  createdAt: string,
  lastUseAt: string,
  useCount: number,
}

const search = (keyword: string): Promise<ISnippet[]> => {
  const where = keyword ? `where title like '%${keyword}%' or content like '%${keyword}%'` : ''
 return api.db.all(`select * from snippets ${where} order by createdAt desc limit 30`)
}

const searchCommand: IListViewCommand = {
  async enter(query, setList, options) {
    const snippets = await search(query)
    return setList(snippets.map(snippet => ({
      title: snippet.title,
      icon: './assets/snippets.png',
      content: snippet.content
    })))
  },

  async search(keyword, setList) {
    const snippets = await search(keyword);
    return setList(
      snippets.map((snippet) => ({
        title: snippet.title,
        icon: "./assets/snippets.png",
        content: snippet.content,
      }))
    );
  },

  select(result, query) {
    const el = document.createElement("pre");
    el.textContent = result.content;
    el.style.cssText =
      "border-radius:6px;height:var(--preview-height);overflow:auto;box-sizing:border-box;padding:12px;";
    return el
  },

  async action(result, action) {
    await api.mainWindow.hide()
    clipboard.writeText(result.content)
    api.keyboard.type("LeftCmd", "V");
  }
}

export default searchCommand