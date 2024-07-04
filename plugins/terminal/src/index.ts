
export default (): IPluginReturn => {
  return {
    onEnter(item, keyword: string) {
      require('child_process').spawn('osascript', [
        '-e',
        `tell application "Terminal" to do script ${JSON.stringify(keyword)}
        activate application "Terminal"`
      ]);
    }
  }
}