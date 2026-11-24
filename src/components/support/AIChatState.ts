import { useSyncExternalStore } from 'react';

interface AIChatStoreState {
  isOpen: boolean;
  isExpanded: boolean;
}

let state: AIChatStoreState = {
  isOpen: false,
  isExpanded: false,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const aichatStore = {
  getState: () => state,
  open: () => {
    state = { ...state, isOpen: true };
    emitChange();
  },
  close: () => {
    state = { ...state, isOpen: false };
    emitChange();
  },
  toggle: () => {
    state = { ...state, isOpen: !state.isOpen };
    emitChange();
  },
  toggleExpanded: () => {
    state = { ...state, isExpanded: !state.isExpanded };
    emitChange();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useAIChatStore() {
  const currentState = useSyncExternalStore(aichatStore.subscribe, aichatStore.getState);
  return {
    ...currentState,
    open: aichatStore.open,
    close: aichatStore.close,
    toggle: aichatStore.toggle,
    toggleExpanded: aichatStore.toggleExpanded,
  };
}
