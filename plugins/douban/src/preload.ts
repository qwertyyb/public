
const createPreview = (item) => {
  const div = document.createElement('div')
  div.classList.add('movie-preview');
  div.textContent = 'loading';
  (async () => {
    const response = await window.publicApp.fetch(item.url)
    const domParser = new DOMParser()
    const doc = domParser.parseFromString(response.text, 'text/html')
    const poster = doc.querySelector<HTMLImageElement>('#mainpic img')?.src
    const title = doc.querySelector('h1 [property="v:itemreviewed"]').textContent
    const description = doc.querySelector('#link-report-intra [property="v:summary"]')?.innerHTML
    const director = Array.from(doc.querySelectorAll<HTMLMetaElement>('meta[property="video:director"]')).map(item => item.content).join('/')
    const actor = Array.from(doc.querySelectorAll<HTMLMetaElement>('meta[property="video:actor"]')).map(item => item.content).join('/')
    const releaseDate = doc.querySelector('#info [property="v:initialReleaseDate"]')?.textContent
    const type = Array.from(doc.querySelectorAll<HTMLElement>('#info [property="v:genre"]')).map(item => item.textContent).join('/')

    div.innerHTML = `
      <div style="display:flex">
        <div>
          <img style="width:160px;height: auto" src="${'https://wsrv.nl/?url=' + encodeURIComponent(poster)}" />
        </div>
        <div style="margin: 0 20px">
          <h2>${title}</h2>
          <ul style="margin-top: 20px">
            <li style="overflow:hidden;margin-top:10px;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">类型: ${type}</li>
            <li style="overflow:hidden;margin-top:10px;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">导演: ${director}</li>
            <li style="overflow:hidden;margin-top:10px;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">演员: ${actor}</li>
            <li style="overflow:hidden;margin-top:10px;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">首播时间: ${releaseDate}</li>
          </ul>
        </div>
      </div>
      <p style="font-size:14px;margin-top:10px;padding-bottom:60px">简介: ${description || '暂无'}</p>
    `
  })()
  return div
}


export default {
  search: window.publicApp.utils.debounce(
    async (keyword: string, setList) => {
      if (!keyword) return setList([])
      // @todo 豆瓣的接口缺少影片首字母查询的能力，为了更好的使用，后续需要使用这个能力
      const response = await window.publicApp.fetch(`https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(keyword)}&cat=1002`)
      const domParser = new DOMParser()
      const doc = domParser.parseFromString(response.text, 'text/html')
      const exec = new Function('const window = {};' + doc.querySelector('#wrapper + script[src] + script').innerHTML + 'return window')
      const resp = exec();
      const list = resp.__DATA__.items.filter(item => item.tpl_name === 'search_subject').map(item => {
        return {
          icon: 'https://wsrv.nl/?url=' + encodeURIComponent(item.cover_url),
          title: item.title,
          subtitle: `${item.rating?.rating_info || item.rating?.value + `(${item.rating.count}人评价)`} ${item.abstract}`,
          url: item.url
        }
      })
      setList(list)
    }
  ),
  select(item, index, keyword) {
    return createPreview(item)
  },
  enter(item) {
    require('electron').shell.openExternal(item.url)
  }
}