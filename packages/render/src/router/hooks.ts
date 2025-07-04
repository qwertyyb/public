import { inject, onBeforeUnmount } from "vue"

export const pageEventSymbol = Symbol('pageEvent')

export const onPageEnter = (callback: () => void) => {
  const pageEvent = inject<EventTarget>(pageEventSymbol)

  const handler = () => callback()
  pageEvent?.addEventListener('pageEnter', handler)

  onBeforeUnmount(() => {
    pageEvent?.removeEventListener('pageEnter', handler)
  })
}

export const onPageLeave = (callback: () => void) => {
  const pageEvent = inject<EventTarget>(pageEventSymbol)

  const handler = () => callback()
  pageEvent?.addEventListener('pageLeave', handler)

  onBeforeUnmount(() => {
    pageEvent?.removeEventListener('pageLeave', handler)
  })
}

export const routerSymbol = Symbol('router')

export const useRouter = () => {
  const router = inject<{
    pushView: (path: string, params?: any) => void
    popView: (options?: { count?: number }) => void
  }>(routerSymbol)
  return router
}