import React from 'react';
import InputBar from './components/InputBar';
import ListItem from './components/ListItem';
import './App.scss';

interface AppState {
  prefix: string,
  prefixPlugin?: AppPlugin,
  plugins: AppPlugin[],
  selectedIndex: number,
}

class App extends React.Component {
  state: AppState
  constructor(props: any) {
    super(props)
    this.state = {
      selectedIndex: 0,
      prefix: '',
      plugins: window.service.getPlugins()
    }
  }

  componentDidMount () {
    document.addEventListener('keydown', this.keydownHandler)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydownHandler)
  }

  componentDidUpdate() {
    const el = document.querySelector('.list-item.selected')
    console.log(el)
    console.log(this)
  }

  keydownHandler = (e: KeyboardEvent) => {
    const { selectedIndex, plugins } = this.state
    if (e.key === 'ArrowUp') {
      this.setState({
        selectedIndex: (selectedIndex - 1 + plugins.length) % plugins.length
      })
    } else if(e.key === 'ArrowDown') {
      this.setState({
        selectedIndex: (selectedIndex + 1) % plugins.length
      })
    } else if(e.key === 'Enter') {
      this.onItemClick(plugins[selectedIndex])
    }
  }

  onItemClick = (item: AppPlugin) => {
    if (!item) return;
    if (item.action) {
      item.action?.(item);
    } else {
      this.setState({
        prefix: item.code,
        prefixPlugin: item,
        selectedIndex: 0,
        plugins: item.children || []
      })
    }
  }
  onPrefixChange = (prefix: string) => {
    const { plugins, selectedIndex } = this.state
    const item = plugins[selectedIndex]
    if (prefix) {
      this.onItemClick(item);
    } else {
      this.setState({
        prefix: '',
        prefixPlugin: null,
        selectedIndex: 0,
        plugins: window.service.getPlugins()
      })
    }
  }
  onInputChange = (value: string) => {
    const plugins = this.state.prefixPlugin ? this.state.prefixPlugin.children || [] : window.service.getPlugins()
    this.setState({
      plugins: plugins.filter(item => item.code.toLocaleLowerCase().includes(value))
    })
  }
  render () {
    return (
      <div className="App">
        <InputBar prefix={this.state.prefix}
          onPrefixChange={this.onPrefixChange}
          onValueChange={this.onInputChange}></InputBar>
        <div className="item-list">
          {this.state.plugins.map((item, index) => (
            <ListItem image={item.image}
              selected={this.state.selectedIndex === index}
              key={item.key}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => this.onItemClick(item)}></ListItem>
          ))
          }
        </div>
      </div>
    );
  }
}

export default App;
