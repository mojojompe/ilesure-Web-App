/**
 * Empty-state illustrations, drawn in the iléSure palette (mustard on warm brown ink).
 *
 * One file, shared verbatim with the renter app (ilesure-pwa/src/components/ui). Inline SVG so
 * they load with the page, scale crisply and need no asset hosting. Colours come from CSS
 * variables with brand defaults, so a screen can retint them without editing the drawings.
 */

import type { ReactNode } from 'react';

export type EmptyIllustrationName =
  | 'listings'
  | 'bookings'
  | 'chats'
  | 'notifications'
  | 'payments'
  | 'team'
  | 'inquiries'
  | 'search'
  | 'saved'
  | 'archive'
  | 'store'
  | 'roommates'
  | 'reviews';

const C = {
  ink: 'var(--ei-ink, #3E1F0A)',
  accent: 'var(--ei-accent, #E8941E)',
  deep: 'var(--ei-deep, #C97B1C)',
  soft: 'var(--ei-soft, #FFF3D6)',
  line: 'var(--ei-line, #E7DCD4)',
  paper: 'var(--ei-paper, #FFFFFF)',
};

const stroke = { stroke: C.ink, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** Soft backdrop, ground shadow and sparkles every illustration sits on. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <>
      <path d="M40 92c-6-34 22-62 58-64 38-2 70 20 66 56-3 30-30 46-64 46-30 0-56-12-60-38z" fill={C.soft} />
      <ellipse cx="100" cy="140" rx="54" ry="6" fill={C.line} opacity="0.7" />
      {children}
      <path d="M30 40l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={C.accent} />
      <path d="M172 30l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill={C.deep} opacity="0.8" />
      <circle cx="176" cy="104" r="3" fill={C.accent} opacity="0.7" />
      <circle cx="24" cy="110" r="2.5" fill={C.deep} opacity="0.6" />
    </>
  );
}

const drawings: Record<EmptyIllustrationName, ReactNode> = {
  listings: (
    <>
      <path d="M58 76l42-34 42 34v58H58z" fill={C.paper} {...stroke} />
      <path d="M50 82l50-42 50 42" fill="none" {...stroke} strokeWidth={4} />
      <rect x="88" y="100" width="24" height="34" rx="3" fill={C.accent} {...stroke} />
      <rect x="66" y="88" width="16" height="14" rx="2" fill={C.soft} {...stroke} />
      <rect x="118" y="88" width="16" height="14" rx="2" fill={C.soft} {...stroke} />
      <circle cx="106" cy="118" r="1.8" fill={C.ink} />
      <rect x="124" y="46" width="10" height="16" fill={C.deep} {...stroke} />
    </>
  ),
  bookings: (
    <>
      <rect x="56" y="44" width="88" height="88" rx="10" fill={C.paper} {...stroke} />
      <path d="M56 54a10 10 0 0110-10h68a10 10 0 0110 10v14H56z" fill={C.accent} {...stroke} />
      <path d="M78 36v16M122 36v16" {...stroke} strokeWidth={4} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={68 + c * 17} y={80 + r * 15} width="10" height="8" rx="2" fill={r === 1 && c === 2 ? C.deep : C.line} />
        ))
      )}
      <circle cx="140" cy="122" r="16" fill={C.deep} {...stroke} />
      <path d="M133 122l5 5 9-10" fill="none" stroke={C.paper} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  chats: (
    <>
      <path d="M48 52h70a10 10 0 0110 10v34a10 10 0 01-10 10H74l-16 14v-14h-10a10 10 0 01-10-10V62a10 10 0 0110-10z" fill={C.paper} {...stroke} />
      <path d="M58 70h50M58 84h34" {...stroke} stroke={C.line} strokeWidth={5} />
      <path d="M150 78H104a8 8 0 00-8 8v26a8 8 0 008 8h30l14 12v-12h2a8 8 0 008-8V86a8 8 0 00-8-8z" fill={C.accent} {...stroke} />
      <circle cx="114" cy="99" r="3.5" fill={C.paper} />
      <circle cx="127" cy="99" r="3.5" fill={C.paper} />
      <circle cx="140" cy="99" r="3.5" fill={C.paper} />
    </>
  ),
  notifications: (
    <>
      <path d="M100 38c-20 0-32 15-32 34v20l-10 16h84l-10-16V72c0-19-12-34-32-34z" fill={C.accent} {...stroke} />
      <path d="M88 116a12 12 0 0024 0" fill={C.paper} {...stroke} />
      <path d="M100 30v8" {...stroke} strokeWidth={4} />
      <path d="M80 70c1-9 7-16 16-18" fill="none" stroke={C.paper} strokeWidth={4} strokeLinecap="round" opacity="0.8" />
      <path d="M150 56c6 6 8 14 6 22M48 56c-6 6-8 14-6 22" fill="none" {...stroke} stroke={C.deep} />
      <path d="M58 132h84" {...stroke} stroke={C.line} />
    </>
  ),
  payments: (
    <>
      <rect x="50" y="62" width="96" height="66" rx="10" fill={C.deep} {...stroke} />
      <path d="M50 76h96" {...stroke} />
      <rect x="112" y="88" width="40" height="24" rx="6" fill={C.paper} {...stroke} />
      <circle cx="124" cy="100" r="4" fill={C.accent} />
      <ellipse cx="68" cy="52" rx="16" ry="6" fill={C.accent} {...stroke} />
      <path d="M52 52v10c0 3 7 6 16 6s16-3 16-6V52" fill={C.accent} {...stroke} />
      <ellipse cx="74" cy="40" rx="14" ry="5" fill={C.soft} {...stroke} />
      <text x="74" y="44" textAnchor="middle" fontSize="9" fontWeight="700" fill={C.ink} fontFamily="sans-serif">₦</text>
    </>
  ),
  team: (
    <>
      <circle cx="78" cy="66" r="15" fill={C.soft} {...stroke} />
      <path d="M50 128c0-20 12-34 28-34s28 14 28 34z" fill={C.accent} {...stroke} />
      <circle cx="124" cy="60" r="17" fill={C.paper} {...stroke} />
      <path d="M92 128c0-24 14-40 32-40s32 16 32 40z" fill={C.deep} {...stroke} />
      <circle cx="152" cy="46" r="11" fill={C.paper} {...stroke} />
      <path d="M152 41v10M147 46h10" {...stroke} strokeWidth={2.5} />
    </>
  ),
  inquiries: (
    <>
      <rect x="48" y="56" width="104" height="72" rx="8" fill={C.paper} {...stroke} />
      <path d="M50 60l50 38 50-38" fill="none" {...stroke} />
      <path d="M50 126l36-30M150 126l-36-30" fill="none" {...stroke} stroke={C.line} />
      <circle cx="142" cy="52" r="18" fill={C.accent} {...stroke} />
      <path d="M136 47a6 6 0 1110 4c-2 1.5-4 2.5-4 5" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      <circle cx="142" cy="61" r="1.8" fill={C.ink} />
    </>
  ),
  search: (
    <>
      <path d="M62 86l26-22 26 22v40H62z" fill={C.paper} {...stroke} />
      <rect x="80" y="104" width="16" height="22" rx="2" fill={C.line} {...stroke} />
      <circle cx="120" cy="78" r="26" fill={C.soft} fillOpacity="0.85" {...stroke} strokeWidth={4} />
      <path d="M139 97l20 20" {...stroke} strokeWidth={8} stroke={C.deep} />
      <path d="M139 97l20 20" fill="none" {...stroke} strokeWidth={3} />
      <path d="M108 70l8 8m0-8l-8 8" {...stroke} stroke={C.accent} strokeWidth={3.5} />
      <path d="M124 70l8 8m0-8l-8 8" {...stroke} stroke={C.accent} strokeWidth={3.5} />
    </>
  ),
  saved: (
    <>
      <rect x="54" y="46" width="76" height="86" rx="10" fill={C.paper} {...stroke} />
      <rect x="64" y="56" width="56" height="34" rx="6" fill={C.soft} {...stroke} />
      <path d="M78 82l10-10 8 8 6-6 10 10" fill="none" {...stroke} strokeWidth={2.5} />
      <path d="M66 102h44M66 114h28" {...stroke} stroke={C.line} strokeWidth={5} />
      <path d="M140 76c-6-10-24-8-24 6 0 12 24 26 24 26s24-14 24-26c0-14-18-16-24-6z" fill={C.accent} {...stroke} />
    </>
  ),
  archive: (
    <>
      <path d="M56 74h88v52a8 8 0 01-8 8H64a8 8 0 01-8-8z" fill={C.deep} {...stroke} />
      <rect x="50" y="58" width="100" height="18" rx="5" fill={C.accent} {...stroke} />
      <rect x="86" y="88" width="28" height="10" rx="5" fill={C.paper} {...stroke} />
      <path d="M74 52l8-16h36l8 16" fill={C.paper} {...stroke} />
      <path d="M90 44h20" {...stroke} stroke={C.line} />
    </>
  ),
  store: (
    <>
      <path d="M58 64h84l-6 66H64z" fill={C.accent} {...stroke} />
      <path d="M82 64v-8a18 18 0 0136 0v8" fill="none" {...stroke} strokeWidth={4} />
      <circle cx="82" cy="71" r="2.5" fill={C.ink} />
      <circle cx="118" cy="71" r="2.5" fill={C.ink} />
      <path d="M88 104l12-10 12 10v14H88z" fill={C.paper} {...stroke} strokeWidth={2.5} />
      <rect x="96" y="108" width="8" height="10" fill={C.deep} />
      <path d="M140 46l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={C.deep} />
    </>
  ),
  roommates: (
    <>
      <circle cx="72" cy="70" r="16" fill={C.paper} {...stroke} />
      <path d="M44 130c0-22 12-38 28-38s28 16 28 38z" fill={C.accent} {...stroke} />
      <circle cx="128" cy="70" r="16" fill={C.paper} {...stroke} />
      <path d="M100 130c0-22 12-38 28-38s28 16 28 38z" fill={C.deep} {...stroke} />
      <path d="M100 46c-3-6-14-5-14 3 0 7 14 15 14 15s14-8 14-15c0-8-11-9-14-3z" fill={C.accent} {...stroke} strokeWidth={2.5} />
    </>
  ),
  reviews: (
    <>
      <rect x="44" y="60" width="112" height="64" rx="10" fill={C.paper} {...stroke} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          transform={`translate(${62 + i * 19} 80)`}
          d="M0 -9l2.6 5.4 6 .8-4.3 4.2 1 5.9L0 4.5l-5.3 2.8 1-5.9-4.3-4.2 6-.8z"
          fill={i < 3 ? C.accent : C.line}
          stroke={C.ink}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
      <path d="M60 102h80M60 112h50" {...stroke} stroke={C.line} strokeWidth={5} />
    </>
  ),
};

export function EmptyIllustration({ name, className }: { name: EmptyIllustrationName; className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} role="img" aria-hidden="true" focusable="false">
      <Stage>{drawings[name]}</Stage>
    </svg>
  );
}
