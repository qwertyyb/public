const queryResults = async (keyword) => {
  const params = new URLSearchParams({
    q: keyword,
    sort: 'best',
  })
  const url = 'https://developer.mozilla.org/api/v1/search/zh-CN?' + params.toString()
  const response = await fetch(url)
}

// console.log('aaa')