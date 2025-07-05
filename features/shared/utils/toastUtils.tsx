// Utilitários para Toast

let count = 0;

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

interface ToastAction {
  type: 'REMOVE_TOAST';
  toastId: string;
}

export function addToRemoveQueue(toastId: string, dispatch: (action: ToastAction) => void, TOAST_REMOVE_DELAY: number) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
} 