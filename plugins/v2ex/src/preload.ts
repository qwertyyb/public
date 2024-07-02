const withCache = <F extends (...args: any[]) => any>(fn: F) => {
  let results = new Map<string, any>()
  return (...args: Parameters<F>): ReturnType<F> => {
    const key = JSON.stringify(args)
    const value = results.get(key)
    if (value) return value;
    const result = fn(...args)
    results.set(key, result)
    return result
  }
}

const getData = withCache(async (type: 'hot' | 'latest' = 'hot') => {
  const url = type === 'hot' ? 'https://www.v2ex.com/api/topics/hot.json?' + Date.now() : 'https://www.v2ex.com/api/topics/latest.json?' + Date.now()
  const response = await window.publicApp.fetch(url)
  const list: { id: string, title: string, subtitle: string, icon: string }[] = JSON.parse(response.text).map(item => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.replies}/${item.node.title}/${item.content}`,
    icon: item.member.avatar_large,
    url: item.url
  }))
  return list
})

getData(window.command.name as 'hot' | 'latest').then(list => {
  window.publicApp.setList(list)
})

export default {
  enter(item) {
    require('electron').shell.openExternal(item.url)
  }
}