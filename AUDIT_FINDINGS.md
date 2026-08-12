# ilesure-Web-App (Agent/Company Web App) — Detailed Audit Findings

**Date:** 2026-08-12 · Vite/React (@paystack/inline-js, socket.io-client, @tanstack/react-table) · Read-only, no code modified.
See the root [PROJECT_AUDIT.md](../PROJECT_AUDIT.md) for the cross-layer summary.

> **Design positive:** payment initiation is server-authoritative (`paymentsApi.initialize({tierId, billingCycle})` → redirect to `authorizationUrl`), verification is server-side (`PaymentCallback.tsx:39` calls `paymentsApi.verify(reference)`), and **no Paystack secret key** exists in the frontend. The issues are token storage, client-trusted role, and a response-shape contract mismatch.

**Totals (WEB-APP-scoped): High 1 · Medium 2 · Low 1**, plus 2 shared ("Both") findings that also affect the PWA.

---

## HIGH

### W-H1. Access **and refresh** JWTs stored in localStorage — XSS-stealable, persistent takeover *(shared with PWA)*
- **Category:** Token-storage / XSS · **Location:** `src/api/client.ts:69-107`, `src/api/authContext.tsx:60-66` (key `ilesure_web_auth`)
- **Defect:** `localStorage.getItem('ilesure_web_auth')` → `parsed.accessToken` (refresh token in the same blob).
- **Impact:** Any XSS / malicious dependency / extension exfiltrates both tokens in one line; the refresh token gives durable, renewable access that survives victim logout.
- **Fix:** httpOnly+Secure+SameSite cookies (backend-set); keep only non-sensitive profile in JS-readable storage.

---

## MEDIUM

### W-M1. Role used for route authorization is read from client-controlled storage *(shared with PWA)*
- **Category:** Route-protection / Client-trust · **Location:** `src/App.tsx:44-62` (`ProtectedRoute` reads `role` from `useAuth()` → localStorage)
- **Defect:** `isAuthenticated`/`role` originate from the localStorage auth blob the user fully controls (`if (!isAuthenticated) return <Navigate to="/login"/>; if (effectiveRole !== role) …`).
- **Impact:** A user can hand-craft `localStorage.ilesure_web_auth = {accessToken:'x', user:{role:'company'}, isAuthenticated:true}` and render the company/agent dashboard shell. Data stays protected **only** because API calls carry the invalid token and 401 — i.e. this is acceptable *only if the backend enforces role on every endpoint*.
- **Fix:** Treat client role as UI-only; ensure the backend authorizes every `/agent/*`, `/company/*`, admin, and booking route server-side.

### W-M2. Login/token response shape in code disagrees with the documented API contract
- **Category:** Flow-mismatch · **Location:** `src/api/authApi.ts:44-56`, `src/api/client.ts:91-99` vs `API_REQUIREMENTS.md:34-57`
- **Defect:** Code reads tokens/user at the **top level** (`data.accessToken`, `data.user`); the doc specifies them **nested under `data`** (`{ success, data:{ user, accessToken, refreshToken } }`). `AuthResponse` declares both shapes (unresolved).
- **Impact:** If the backend follows its own doc, `data.user`/`data.accessToken` are `undefined` → login silently returns "Login failed" on HTTP 200. Same ambiguity for `/auth/refresh`.
- **Fix:** Pin one shape and read it consistently across web-app + PWA (both assume top-level).

### W-M3. Verbose request/response `console` logging leaks user data in production *(shared with PWA)*
- **Category:** Secret-exposure · **Location:** `src/api/socket.ts:23-34`, scattered `console.error(err)` in pages; no `drop_console` in the Vite config.
- **Impact:** PII / socket internals exposed in shipped builds.
- **Fix:** Enable `esbuild.drop:['console']` (or Terser `drop_console`) for production.

---

## LOW

### W-L1. Roommate routes are not wrapped in `ProtectedRoute`
- **Category:** Route-protection · **Location:** `src/App.tsx:226-227` (`/roommate/profile`, `/roommate/matches` rendered without a guard)
- **Defect:** Unlike all `/agent/*` and `/company/*` routes, the two roommate routes have no auth wrapper.
- **Impact:** The page shell is deep-linkable while logged out; data still requires a valid token (backend-enforced), so exposure is UI-only.
- **Fix:** Wrap in an authenticated (or student-role) route for consistency.

---

## Verified OK (WEB-APP)
- **Server-authoritative payment initiation and verification**; no `@paystack/inline-js` popup with a client amount; **no Paystack secret key** anywhere (only `VITE_PAYSTACK_PUBLIC_KEY`, `config.ts:3`).
- Socket auth uses the handshake `auth` payload, not the URL; `Authorization` attached only to the app's own base URL client (no analytics leak).
- `.gitignore` correctly lists `.env`; no committed `.env` or hardcoded secrets found.
