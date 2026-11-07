/**
 * Open and close the Dojah widget (window.Connect) from one place.
 *
 * Dojah's script closes its modal only on its own "close" message from the iframe. Anything else
 * the iframe posts (for instance from the success screen shown on a computer after the check was
 * finished on a phone) is passed to `onError` and the modal stays up, and the widget draws no
 * close control of its own on top. We keep the instance so we can close it ourselves: on errors,
 * when the result arrives by another route, and on Escape.
 */

let current: { close: () => void } | null = null;
let removeKeyHandler: (() => void) | null = null;

export function closeDojahModal(): void {
  const instance = current;
  current = null;
  removeKeyHandler?.();
  removeKeyHandler = null;
  try {
    instance?.close();
  } catch (err) {
    console.error('[Dojah] close failed', err);
  }
}

export function isDojahModalOpen(): boolean {
  return current !== null;
}

/** Wraps the caller's callbacks so the modal always comes down on error or close. */
export function openDojahModal(options: Record<string, any>): void {
  const Connect = (window as any).Connect;
  if (!Connect) throw new Error('Dojah widget not loaded');
  closeDojahModal();

  const { onError, onClose, onSuccess } = options;
  const instance = new Connect({
    ...options,
    onSuccess: (response: any) => {
      onSuccess?.(response);
      // The widget closes itself a second later on success; make sure it does.
      window.setTimeout(() => { if (current === instance) closeDojahModal(); }, 1500);
    },
    onError: (err: any) => {
      onError?.(err);
      if (current === instance) closeDojahModal();
    },
    onClose: () => {
      if (current === instance) {
        current = null;
        removeKeyHandler?.();
        removeKeyHandler = null;
      }
      onClose?.();
    },
  });
  current = instance;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && current === instance) {
      closeDojahModal();
      onClose?.();
    }
  };
  window.addEventListener('keydown', onKey);
  removeKeyHandler = () => window.removeEventListener('keydown', onKey);

  instance.setup();
  instance.open();
}
