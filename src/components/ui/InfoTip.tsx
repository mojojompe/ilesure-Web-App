import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { InformationCircleIcon } from '@hugeicons/react';

/**
 * A small (i) button that opens a short explanation under it. Click or tap to open (no
 * hover, so it works the same on phones); click outside, scroll or press Escape to close.
 * The panel is placed against the viewport and clamped to it, so an icon near the right
 * edge of a phone screen still opens a fully visible panel.
 */
const PANEL_WIDTH = 288;
const GUTTER = 12;

export function InfoTip({ title, children }: { title: string; children: ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const open = pos !== null;
  const ref = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (open || !button.current) return setPos(null);
    const r = button.current.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - GUTTER * 2);
    const left = Math.min(Math.max(r.left, GUTTER), window.innerWidth - width - GUTTER);
    setPos({ top: r.bottom + 6, left, width });
  };
  const close = () => setPos(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex align-middle normal-case tracking-normal font-normal">
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-label={`What is ${title}?`}
        aria-expanded={open}
        aria-controls={id}
        className="ml-1 inline-flex items-center justify-center rounded-full text-text-tertiary hover:text-mustard focus:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
      >
        <InformationCircleIcon className="w-4 h-4" />
      </button>
      {pos && (
        <span
          id={id}
          role="tooltip"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          className="fixed z-50 rounded-clay-sm border border-clay-border bg-white p-3 text-xs leading-relaxed text-text-secondary shadow-clay"
        >
          <span className="block font-semibold text-text-primary mb-1">{title}</span>
          {children}
        </span>
      )}
    </span>
  );
}
