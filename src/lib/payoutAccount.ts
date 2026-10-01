/**
 * Payout account form rules shared by the agent and company Settings cards.
 *
 * The server is the authority (it resolves the holder with Paystack and enforces the naming
 * rule); these helpers only decide what the form lets the user do and what to show.
 */
import type { OwnerError, SubaccountInfo } from '../api/owner';

export interface PayoutForm {
  bankCode: string;
  accountNumber: string;
}

/** Digits only, at most 10 (a NUBAN). */
export function cleanAccountNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

export function canVerify(form: PayoutForm): boolean {
  return Boolean(form.bankCode) && /^\d{10}$/.test(form.accountNumber);
}

/** True when the form points at the account already on file (nothing to change). */
export function isCurrentAccount(form: PayoutForm, current: SubaccountInfo | null | undefined): boolean {
  return Boolean(current?.subaccountCode)
    && current!.accountNumber === form.accountNumber
    && current!.bankCode === form.bankCode;
}

/** Save is allowed once the account was verified (holder name shown) and it is a new account. */
export function canSave(form: PayoutForm, resolvedName: string, current: SubaccountInfo | null | undefined): boolean {
  return canVerify(form) && Boolean(resolvedName.trim()) && !isCurrentAccount(form, current);
}

/**
 * The message to show after a failed save or removal. Refusals the user can act on
 * (NAME_MISMATCH, PAYOUT_ACCOUNT_IN_USE, INVALID_BANK_ACCOUNT) carry the server's own
 * explanation; anything else falls back to the operation's message when the server sent none.
 */
export function payoutFailureMessage(error: OwnerError | undefined, fallback: string): string {
  return error?.message?.trim() || fallback;
}

export function formatChangedAt(changedAt: string | null | undefined): string | null {
  if (!changedAt) return null;
  const d = new Date(changedAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}
