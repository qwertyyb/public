import React from 'react';
import InputBar from './InputBar';
import ListItem from './ListItem';
// import { IPCEventName } from '../../shared/constant';
import './ResultList.scss';

interface MainViewState {
  keyword: string,
  prefix: string,
  prefixPlugin?: AppPlugin,
  plugins: AppPlugin[],
  selectedIndex: number,
  result: Map<PublicPlugin, CommonListItem[]>
}

class MainView extends React.Component {
  state: MainViewState
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
    const { selectedIndex, plugins, result } = this.state
    const listLength = Array.from(result.values())
      .reduce((total, list) => total + list.length, 0)
    if (e.key === 'ArrowUp') {
      this.setState({
        selectedIndex: (selectedIndex - 1 + listLength) % listLength
      })
      e.stopPropagation()
    } else if(e.key === 'ArrowDown') {
      this.setState({
        selectedIndex: (selectedIndex + 1) % listLength
      })
      e.stopPropagation()
    } else if(e.key === 'Enter') {
      // @ts-ignore
      document.querySelector('.list-item.selected')?.click?.();
      e.stopPropagation()
    } else if(e.key === 'Backspace' && !this.state.keyword && this.state.prefix) {
    }
  }

  onItemClick = (
    item: CommonListItem,
    index: number,
    pluginResult: CommonListItem[],
    plugin: PublicPlugin
  ) => {
    if (!item) return;
    window.PluginManager.handleEnter(plugin, {
      item,
      index,
      list: pluginResult
    })
    window.ipcRenderer.invoke('HideWindow')
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

  renderResult() {
    let totalIndex = -1
    return Array.from(this.state.result.keys()).map((plugin, index) => {
      const pluginResults = this.state.result.get(plugin)
      return pluginResults?.map(item => {
        totalIndex += 1;
        return (
          <ListItem image={item.icon}
            selected={this.state.selectedIndex === totalIndex}
            key={item.key}
            title={item.title}
            subtitle={item.subtitle}
            onClick={() => this.onItemClick(item, index, pluginResults, plugin)}></ListItem>
        )
      })
    })
  }

  render () {
    return (
      <div className="App">
        <InputBar prefix={this.state.prefix}
          value={this.state.keyword}
          onValueChange={this.onInputChange}></InputBar>
        <div className="item-list">
          {this.renderResult()}
        </div>
      </div>
    );
  }
}

export default MainView;
