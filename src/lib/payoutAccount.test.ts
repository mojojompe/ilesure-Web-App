import { describe, it, expect } from 'vitest';
import { cleanAccountNumber, canVerify, canSave, isCurrentAccount, payoutFailureMessage, formatChangedAt } from './payoutAccount';

const current = { subaccountCode: 'ACCT_test', bankCode: '001', accountNumber: '0000000001', accountName: 'ADA EZE' };

describe('payout account form rules', () => {
  it('keeps only ten digits', () => {
    expect(cleanAccountNumber('00-0000 00012345')).toBe('0000000001');
  });

  it('verify needs a bank and a full NUBAN', () => {
    expect(canVerify({ bankCode: '', accountNumber: '0000000001' })).toBe(false);
    expect(canVerify({ bankCode: '001', accountNumber: '000000001' })).toBe(false);
    expect(canVerify({ bankCode: '001', accountNumber: '0000000001' })).toBe(true);
  });

  it('save needs a resolved holder and a different account from the one on file', () => {
    expect(canSave({ bankCode: '001', accountNumber: '0000000002' }, '', current)).toBe(false);
    expect(canSave({ bankCode: '001', accountNumber: '0000000002' }, 'ADA EZE', current)).toBe(true);
    expect(isCurrentAccount({ bankCode: '001', accountNumber: '0000000001' }, current)).toBe(true);
    expect(canSave({ bankCode: '001', accountNumber: '0000000001' }, 'ADA EZE', current)).toBe(false);
    // Same number at a different bank is a change.
    expect(canSave({ bankCode: '002', accountNumber: '0000000001' }, 'ADA EZE', current)).toBe(true);
    expect(canSave({ bankCode: '001', accountNumber: '0000000001' }, 'ADA EZE', null)).toBe(true);
  });

  it('shows the server\'s refusal and falls back only when it sent none', () => {
    const msg = 'This account belongs to JOHN DOE, which does not match your verified name Ada Eze.';
    expect(payoutFailureMessage({ message: msg, code: 'NAME_MISMATCH' }, 'Failed')).toBe(msg);
    expect(payoutFailureMessage({ message: '  ' }, 'Failed to save')).toBe('Failed to save');
    expect(payoutFailureMessage(undefined, 'Failed to save')).toBe('Failed to save');
  });

  it('formats the change date and tolerates junk', () => {
    expect(formatChangedAt(null)).toBeNull();
    expect(formatChangedAt('not a date')).toBeNull();
    expect(formatChangedAt('2026-09-30T10:00:00Z')).toMatch(/2026/);
  });
});
