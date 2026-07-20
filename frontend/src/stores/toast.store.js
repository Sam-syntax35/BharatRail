import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
  toasts: [], // { id, message, type: 'success' | 'error' | 'info', duration }

  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  success: (msg, duration) => useToastStore.getState().addToast(msg, 'success', duration),
  error: (msg, duration) => {
    if (msg === 'REQUEST_CANCELLED' || (msg && typeof msg === 'object' && msg.message === 'REQUEST_CANCELLED')) {
      return;
    }
    useToastStore.getState().addToast(msg, 'error', duration);
  },
  info: (msg, duration) => useToastStore.getState().addToast(msg, 'info', duration),
};
