import api from '@public/api'

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
  const response = await api.fetch(url)
  console.log(response)
  const list: { id: string, title: string, subtitle: string, icon: string }[] = (await response.json()).map((item: any) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.replies}/${item.node.title}/${item.content}`,
    icon: item.member.avatar_large,
    url: item.url
  }))
  return list
})

window.publicAppCommand = {
  enter(query, setList, options) {
    getData(options.command.name as 'hot' | 'latest').then(list => {
      setList(list)
    })
  },
  action(item: any) {
    require('electron').shell.openExternal(item.url)
  }
}