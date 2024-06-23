import { Component, Show } from "solid-js";
import styles from './index.module.css'
import { CommonListItem } from "../../../../shared/types/plugin";
import Logo from '../../logo.svg'
import Back from '../../assets/back.svg'

interface Props {
  value: string
  setValue: (value: string) => any,

  command?: CommonListItem | null,
  exit: () => void
}

const InputBar: Component<Props> = (props) => {
  let inputEl: HTMLInputElement | null = null
  const focusInput = () => {
    inputEl!.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!inputEl!.value && event.key === 'Backspace') {
      props.exit()
    }
  }

  return (
    <div class={styles.inputBar} onClick={focusInput}>
      <div class={styles.inputBarWrapper}>
        <Show when={props.command}>
          <div class={styles.navBack} onClick={props.exit}>
            <img src={Back} alt="" class={styles.backIcon} draggable="false" />
          </div>
        </Show>
        <input type="text"
          class={styles.input}
          ref={inputEl!}
          placeholder="请搜索"
          onInput={event => props.setValue(event.target.value)}
          onKeyDown={onKeyDown}
          value={props.value}
          id="main-input"/>
        <img src={props.command?.icon ?? Logo} alt="" class={styles.appLogo} draggable="false" />
      </div>
    </div>
  )
}

export default InputBar