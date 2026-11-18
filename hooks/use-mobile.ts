import * as React from "react"

const MOBILE_BREAKPOINT = 768

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Matches Tailwind `lg:` (1024px) — campainha usa Popover acima disto. */
const LG_BREAKPOINT = 1024
const LG_UP_QUERY = `(min-width: ${LG_BREAKPOINT}px)`

function subscribeLgUp(onStoreChange: () => void) {
  const mql = window.matchMedia(LG_UP_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getLgUpSnapshot() {
  return window.matchMedia(LG_UP_QUERY).matches
}

export function useIsLgUp() {
  return React.useSyncExternalStore(
    subscribeLgUp,
    getLgUpSnapshot,
    () => false,
  )
}

/** True após hidratação (evita mismatch do badge SSR vs cliente). */
export function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}
