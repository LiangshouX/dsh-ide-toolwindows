import { useSyncExternalStore } from 'react'

/** Subscribe one component to the whole workbench snapshot. */
export function useWorkbench(store) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
