import React from 'react';
import './InputBar.scss';

interface InputBarProps {
  prefix: string,
  onPrefixChange: (prefix: string) => void,
  onValueChange: (value: string) => void
}

class InputBar extends React.Component<InputBarProps> {
  state = {
    value: ''
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    console.log(e)
    if (e.key === 'Enter' && this.state.value) {
      this.props.onPrefixChange(this.state.value)
      this.setState({
        value: ''
      })
    } else if (e.key === 'Backspace' && !this.state.value && this.props.prefix) {
      this.props.onPrefixChange('')
    }
  }
  onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    this.setState({ value })
    this.props.onValueChange(value)
  }
  render() {
    return (
      <div className="input-bar flex items-center">
        {this.props.prefix ? <div className="prefix flex-h-v">{this.props.prefix}</div> : null}
        <input type="text"
          onChange={this.onValueChange}
          onKeyDown={this.onKeyDown}
          value={this.state.value} />
      </div>
    )
  }
}

export default InputBar