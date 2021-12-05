const queryRecordList = async ({ keyword = '' } = {}, { strict = false } = {}) => {
  const sql = `SELECT * FROM clipboardHistory where text like $keyword order by lastUseAt DESC`
  const query = strict ? keyword : `%${keyword}%`
  return window.publicApp.db.all(sql, { $keyword: query })
}

module.exports = {
  async onInput(keyword) {
    let list = await queryRecordList({ keyword })
    list = list.map((item) => {
      const subtitle = `最后使用: ${item.lastUseAt}     创建于: ${item.createdAt}`
      return {
        key: `plugin:clipboard:${item.text}`,
        title: item.text,
        subtitle,
        icon: 'https://img.icons8.com/cute-clipart/64/000000/clipboard.png',
        contentValue: item.text
      }
    })
    return list
  },
  async onEnter(item) {
    window.publicApp.hideMainWindow()
    await navigator.clipboard.writeText(item.contentValue)
    window.publicApp.simulate.keyTap('v', 'command')
  },
}
