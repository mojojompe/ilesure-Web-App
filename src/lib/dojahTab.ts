/**
 * Open Dojah's hosted verification page (identity.dojah.io?widget_id=...) in its own tab.
 *
 * Why not the embedded widget (window.Connect): it ran inside an iframe on our page with the
 * public key baked into this build, and that key is a Sandbox key. The hosted link carries no key;
 * Dojah runs the widget in the environment the widget itself belongs to (Live). As a page of its
 * own it also gets the camera directly, so the BVN face step no longer depends on our page
 * delegating camera access to an iframe (mobile browsers are the least forgiving about that).
 *
 * The result comes back through the server: Dojah's webhook, and /kyc/sync, which
 * useKycResultWatcher polls and re-checks when the person returns to this tab.
 *
 * Browsers only allow a new tab straight from a tap, and the link is ready only after
 * /kyc/initialize answers. So: reserve the tab during the tap, then point it at the link.
 */

export function reserveDojahTab(): Window | null {
  let tab: Window | null = null;
  try {
    tab = window.open('', '_blank');
  } catch {
    tab = null;
  }
  if (tab) {
    try {
      tab.document.title = 'Opening verification…';
      tab.document.body.style.fontFamily = 'system-ui, sans-serif';
      tab.document.body.style.padding = '24px';
      tab.document.body.textContent = 'Opening Dojah verification…';
    } catch {
      // A blank tab we cannot write to still works.
    }
  }
  return tab;
}

/** Points the reserved tab at Dojah. Returns false when there is no tab (popup blocked). */
export function sendDojahTab(tab: Window | null, url: string): boolean {
  if (!tab || tab.closed) return false;
  try {
    // Dojah's page has no business with our window.
    tab.opener = null;
  } catch {
    /* ignore */
  }
  tab.location.href = url;
  return true;
}

/** Closes a reserved tab that will not be used (initialize failed). */
export function discardDojahTab(tab: Window | null): void {
  try {
    if (tab && !tab.closed) tab.close();
  } catch {
    /* ignore */
  }
}
