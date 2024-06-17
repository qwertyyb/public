import { Component } from "solid-js";
import styles from './index.module.css'

const InputBar: Component<{ onInput: (event: InputEvent) => void }> = (props) => {
  let inputEl: HTMLInputElement | null = null
  const focusInput = () => {
    inputEl!.focus()
  }
  return (
    <div class={styles.inputBar} onClick={focusInput}>
      <div class={styles.inputBarWrapper}>
        <input type="text"
          class={styles.input}
          ref={inputEl!}
          placeholder="请搜索"
          onInput={props.onInput}
          id="main-input"/>
        <img src="/src/logo.svg" alt="" class={styles.appLogo} draggable="false" />
      </div>
    </div>
  )
}

export default InputBar