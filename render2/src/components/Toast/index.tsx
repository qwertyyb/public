import { Component, Show, createSignal, mergeProps, onCleanup, onMount } from "solid-js";
import styles from './index.module.css'

interface ToastProps {
  title?: string
  icon?: 'success' | 'error',
  image?: string
  duration?: number,
}
declare global {
  interface WindowEventMap {
    'toast:show': CustomEvent<{ options: ToastProps }>
  }
}

const iconMap: Record<'success' | 'error', string> = {
  success: 'check',
  error: 'warning',
}

const Toast: Component = () => {
  const [options, setOptions] = createSignal<ToastProps | null>()
  let timeout: ReturnType<typeof setTimeout> | null = null

  onMount(() => {
    const handler = (event: CustomEvent<{ options: ToastProps } >) => {
      console.log('event')
      const options = event.detail.options
      setOptions(options)
      timeout = setTimeout(() => { setOptions(null) }, options.duration || 1500)
    }
    window.addEventListener('toast:show', handler)
    onCleanup(() => {
      timeout && clearTimeout(timeout)
      window.removeEventListener('toast:show', handler)
    })
  })

  return (
    <Show when={options()}>
      <div class={styles.toast}>
        <Show when={options()!.icon}>
          <span class={"material-symbols-outlined " + styles.icon}>{iconMap[options()!.icon!]}</span>
        </Show>
        <Show when={!options()!.icon && options()!.image}>
          <img src="https://fakeimg.pl/40x40" alt="" class={styles.icon} />
        </Show>
        <div class={styles.title}>{ options()!.title }</div>
      </div>
    </Show>
  )
}

export default Toast
