import React from 'react';
import InputBar from './components/InputBar';
import ListItem from './components/ListItem';
// import { IPCEventName } from '../../shared/constant';
import './App.scss';

interface AppState {
  keyword: string,
  prefix: string,
  prefixPlugin?: AppPlugin,
  plugins: AppPlugin[],
  selectedIndex: number,
  result: Map<PublicPlugin, CommonListItem[]>
}

class App extends React.Component {
  state: AppState
  resizeObserver: any
  constructor(props: any) {
    super(props)
    this.state = {
      selectedIndex: 0,
      prefix: '',
      keyword: '',
      plugins: [],
      result: new Map(),
    }
  }

  componentDidMount () {
    document.addEventListener('keydown', this.keydownHandler, true)
    this.resizeObserver = new window.ResizeObserver((entries: any) => {
      const { width, height } = entries.pop().contentRect;
      window.ipcRenderer.invoke('ResizeWindow', { width, height })
    })
    this.resizeObserver.observe(document.documentElement)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydownHandler, true)
    this.resizeObserver.disconnect()
  }

  componentDidUpdate() {
    document.querySelector('.list-item.selected')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  keydownHandler = (e: KeyboardEvent) => {
    const { selectedIndex, plugins } = this.state
    if (e.key === 'ArrowUp') {
      this.setState({
        selectedIndex: (selectedIndex - 1 + plugins.length) % plugins.length
      })
      e.stopPropagation()
    } else if(e.key === 'ArrowDown') {
      this.setState({
        selectedIndex: (selectedIndex + 1) % plugins.length
      })
      e.stopPropagation()
    } else if(e.key === 'Enter') {
      // this.onItemClick(plugins[selectedIndex])
      e.stopPropagation()
    } else if(e.key === 'Backspace' && !this.state.keyword && this.state.prefix) {
    }
  }

  onItemClick = (item: CommonListItem, index: number, pluginResult: CommonListItem[]) => {
    if (!item) return;
    if (item.onEnter) {
      item.onEnter?.(item, index, pluginResult);
    } else {
      this.setState({
        keyword: '',
        prefix: item.code,
        prefixPlugin: item,
        selectedIndex: 0,
        plugins: item.children || []
      })
    }
  }
  onInputChange = (value: string) => {
    this.setState({
      keyword: value
    })
    const setResult = (plugin: PublicPlugin, list: CommonListItem[]) => {
      const result = new Map(this.state.result.set(plugin, list))
      this.setState({
        result
      })
    }
    window.PluginManager.handleInput(value, setResult)
  }
  render () {
    return (
      <div className="App">
        <InputBar prefix={this.state.prefix}
          value={this.state.keyword}
          onValueChange={this.onInputChange}></InputBar>
        <div className="item-list">
          {Array.from(this.state.result.keys()).map((plugin, index) => {
            const pluginResults = this.state.result.get(plugin)
            return pluginResults?.map(item => (
              <ListItem image={item.icon}
                selected={this.state.selectedIndex === index}
                key={item.code}
                title={item.title}
                subtitle={item.subtitle}
                onClick={() => this.onItemClick(item, index, pluginResults)}></ListItem>
            ))
          })
          }
        </div>
      </div>
    );
  }
}

export default App;
