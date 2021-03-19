import React from 'react';
import InputBar from './InputBar';
import ListItem from './ListItem';
import ResultView from './ResultView';
import './ResultList.scss';
import { PublicPlugin, CommonListItem } from '../../../shared/types/plugin';

interface MainViewState {
  keyword: string,
  prefix: string,
  selectedIndex: number,
  result: Map<PublicPlugin, CommonListItem[]>,
  preview: string,
}

class MainView extends React.Component {
  state: MainViewState
  constructor(props: any) {
    super(props)
    this.state = {
      selectedIndex: 0,
      prefix: '',
      keyword: '',
      result: new Map(),
      preview: '',
    }
    // @ts-ignore
    window.clearAndFocusInput = this.clearAndFocusInput
    // @ts-ignore
    window.setQuery = this.onInputChange
  }

  componentDidMount () {
    document.addEventListener('keydown', this.keydownHandler, true)
    // @ts-ignore
    document.addEventListener('mainwindowshow', this.focusInput)
    document.addEventListener('plugin:setList', this.setPluginListHandler)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydownHandler, true)
    document.removeEventListener('plugin:setList', this.setPluginListHandler)
    // @ts-ignore
    document.removeEventListener('mainwindowshow', this.focusInput)
  }

  componentDidUpdate() {
    setTimeout(() => {
      document.querySelector('.list-item.selected')?.scrollIntoView({ block: 'center' })
    }, 200)
  }

  clearAndFocusInput = () => {
    this.setState({
      keyword: '',
      selectedIndex: 0,
    })
    this.focusInput();
  }

  focusInput = () => {
    const input = document.querySelector('#main-input') as HTMLInputElement
    input.focus()
  }

  setPluginListHandler = (e: any) => {
    const { plugin, list } = e.detail || {}
    const result = new Map(this.state.result.set(plugin, list))
    this.setState({
      result
    })
  }

  keydownHandler = (e: KeyboardEvent) => {
    const { selectedIndex, result } = this.state
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

  getPreview = () => {
    const item = Array.from(this.state.result.values()).flat()[this.state.selectedIndex]
    return item?.preview
  }

  onItemClick = (
    item: CommonListItem,
    index: number,
    pluginResult: CommonListItem[],
    plugin: PublicPlugin
  ) => {
    if (!item) return;
    window.ipcRenderer.send('HideWindow')
    this.clearAndFocusInput()
    window.PluginManager.handleEnter(plugin, {
      item,
      index,
      list: pluginResult
    })
  }
  onInputChange = (value: string) => {
    this.setState({
      keyword: value,
      selectedIndex: 0,
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
        <InputBar
          value={this.state.keyword}
          onValueChange={this.onInputChange}></InputBar>
          {
            this.state.keyword ?
            <div className="result-container flex">
              <div className="item-list">
                {this.renderResult()}
              </div>
              <div className="item-preview"
                style={{
                  display: this.getPreview() ? 'block' : 'none'
                }}>
                <ResultView>{this.getPreview()}</ResultView>
              </div>
            </div>
            : null
          }
      </div>
    );
  }
}

export default MainView;
