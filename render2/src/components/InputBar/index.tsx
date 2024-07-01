import { Component, Show, onCleanup, onMount } from "solid-js";
import styles from './index.module.css'
import { ListItem } from "../../../../shared/types/plugin";
import Logo from '../../logo.svg'
import Back from '../../assets/back.svg'

interface Props {
  value: string
  setValue: (value: string) => any,

  command?: ListItem | null,
  exit: () => void,

  disable?: boolean,
}

const InputBar: Component<Props> = (props) => {
  let inputEl: HTMLInputElement | null = null
  const focusInput = () => {
    inputEl!.focus()
  }
  onMount(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (props.value) {
          event.preventDefault()
          props.setValue('')
        } else if (props.command) {
          event.preventDefault()
          props.exit()
        } else {
          event.preventDefault()
          window.publicApp?.mainWindow?.hide?.()
        }
      } else if (event.key === 'Backspace' && !props.value) {
        if (props.command) {
          event.preventDefault()
          props.exit()
        }
      }
    }
    window.addEventListener('keydown', handler)
    onCleanup(() => {
      window.removeEventListener('keydown', handler)
    })
  })

  return (
    <div class={styles.inputBar} onClick={focusInput} tabindex="0">
      <div class={styles.inputBarWrapper}>
        <Show when={props.command}>
          <div class={styles.navBack + ' material-symbols-outlined'} onPointerDown={props.exit}>
            arrow_back
          </div>
        </Show>
        <Show when={!props.disable}>
          <input type="text"
            class={styles.input}
            ref={inputEl!}
            placeholder="请搜索"
            onInput={event => props.setValue(event.target.value)}
            value={props.value}
            size={props.value.length}
            id="main-input"/>
        </Show>
        {/* <div class={styles.searchSpace}></div> */}
        <img src={props.command?.icon ?? Logo} alt="" class={styles.appLogo} draggable="false" />
      </div>
    </div>
  )
}

export default InputBar