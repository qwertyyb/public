const queryResults = async (keyword) => {
  const params = new URLSearchParams({
    q: keyword,
    sort: 'best',
  })
  const url = 'https://developer.mozilla.org/api/v1/search/en-US?' + params.toString()
  const response = await fetch(url)
  const json = await response.json()

  return json.documents.map(document => {
    const { title = [], body = [] } = document.highlight || {}
    const titles = title.map(t => `<h2>${t}</h2>`).join('<br />')
    const bodys = body.map(b => `<div>${b}</div>`).join('\n')
    return {
      title: document.title,
      subtitle: document.summary,
      url: 'https://developer.mozilla.org' + document.mdn_url,
      detail: titles + bodys
    }
  })
}

const app = new Vue({
  el: '#app',
  data: {
    list: [],
    selectedIndex: 0
  },
  computed: {
    detail () {
      return this.list[this.selectedIndex]?.detail
    }
  },
  created() {
  },
  methods: {
    async onInput(keyword) {
      this.list = await queryResults(keyword)
      this.selectedIndex = 0
    },
    onDetail(item) {
      return item.detail
    }
  }
})

window.plugin = {
  onInput: app.onInput,
  onPreview: app.onPreview
}
