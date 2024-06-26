

export default {
  search: window.publicApp.utils.debounce(
    async (keyword: string, setList) => {
      if (!keyword) return setList([])
      // @todo 豆瓣的接口缺少影片首字母查询的能力，为了更好的使用，后续需要使用这个能力
      const response = await window.publicApp.fetch(`https://m.douban.com/search/?query=${encodeURIComponent(keyword)}&type=1002`)
      const domParser = new DOMParser()
      const doc = domParser.parseFromString(response.text, 'text/html')
      const list = Array.from(doc.querySelectorAll<HTMLLIElement>('.search_results_subjects > li')).map(node => {
        const title = node.querySelector('.subject-title')?.textContent
        const subtitle = node.querySelector<HTMLElement>('.rating-stars + span')?.textContent
        // 防盗链处理
        const poster = node.querySelector('img')?.src
        const icon = poster ? 'https://wsrv.nl/?url=' + encodeURIComponent(poster) : ''
        return { icon, title, subtitle }
      })
      setList(list)
    }
  )
}