import React, { useEffect, useState } from 'react';
import './InputBar.scss';

const getPlaceholder = () => fetch('http://open.iciba.com/dsapi/').then(res => res.json())

interface InputBarProps {
  value: string,
  onValueChange: (value: string) => void
}


function InputBar(props: InputBarProps) {
  const [placeholder, setPlaceholder] = useState('');
  useEffect(() => {
    if (props.value) return;
    getPlaceholder()
      .then(res => setPlaceholder(res.note))
  })
  return (
    <div className="input-bar">
      <div className="input-bar-wrapper flex items-center">
        <input type="text"
          placeholder={placeholder}
          id="main-input"
          onChange={e => props.onValueChange(e.target.value)}
          value={props.value} />
      </div>
    </div>
  )
}

export default InputBar