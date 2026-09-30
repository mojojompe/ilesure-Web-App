import { describe, expect, it } from 'vitest';
import {
  ApiRequestError,
  CLIENT_ERROR_CODES,
  ERROR_CODE,
  NETWORK_ERROR_MESSAGE,
  getApiError,
  getApiErrorMessage,
  getErrorDetail,
  hasErrorCode,
  isKnownErrorCode,
  toApiFailure,
} from './apiError';

/** The shape axios rejects with when the server answered. */
function axiosError(status: number, data: unknown) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    code: 'ERR_BAD_REQUEST',
    response: { status, data },
  });
}

describe('getApiError', () => {
  it('reads the error envelope', () => {
    const err = axiosError(409, {
      success: false,
      error: { code: 'DATES_UNAVAILABLE', message: 'Those dates are taken.' },
    });
    expect(getApiError(err, 'fallback')).toEqual({
      code: 'DATES_UNAVAILABLE',
      message: 'Those dates are taken.',
      details: undefined,
      status: 409,
    });
  });

  it('passes error.details through (fields that moved off the top level)', () => {
    const err = axiosError(429, {
      success: false,
      error: { code: 'RESEND_TOO_SOON', message: 'Please wait 42s', details: { retryAfter: 42 } },
    });
    const apiError = getApiError(err);
    expect(apiError.code).toBe(ERROR_CODE.RESEND_TOO_SOON);
    expect(apiError.details).toEqual({ retryAfter: 42 });
    expect(getErrorDetail<number>(err, 'retryAfter')).toBe(42);
    expect(hasErrorCode(err, 'RESEND_TOO_SOON')).toBe(true);
  });

  it('reads a legacy { error: "text" } body and derives the code from the status', () => {
    const err = axiosError(404, { error: 'Listing not found' });
    expect(getApiError(err)).toMatchObject({ code: 'NOT_FOUND', message: 'Listing not found', status: 404 });
  });

  it('reads a legacy { message } body', () => {
    expect(getApiErrorMessage(axiosError(400, { success: false, message: 'Bad input' }))).toBe('Bad input');
  });

  it('uses the fallback for a body with no message (e.g. an HTML proxy page)', () => {
    const err = axiosError(502, '<html>Bad gateway</html>');
    expect(getApiError(err, 'Could not save')).toMatchObject({ code: 'SERVER_ERROR', message: 'Could not save', status: 502 });
  });

  it('reports a network error when there is no response', () => {
    const err = Object.assign(new Error('Network Error'), { isAxiosError: true, code: 'ERR_NETWORK', request: {} });
    const apiError = getApiError(err, 'fallback');
    expect(apiError.code).toBe(CLIENT_ERROR_CODES.NETWORK_ERROR);
    expect(apiError.message).toBe(NETWORK_ERROR_MESSAGE);
    expect(apiError.status).toBeUndefined();
  });

  it('keeps the message of a plain Error thrown by app code', () => {
    expect(getApiError(new Error('No signed contract found'))).toMatchObject({
      code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
      message: 'No signed contract found',
    });
  });

  it('passes an ApiRequestError through unchanged', () => {
    const thrown = new ApiRequestError({ code: 'TIER_LIMIT_REACHED', message: 'Upgrade to add more', details: { limit: 3 }, status: 403 });
    expect(getApiError(thrown)).toEqual({ code: 'TIER_LIMIT_REACHED', message: 'Upgrade to add more', details: { limit: 3 }, status: 403 });
  });

  it('reads an already-parsed envelope (fetch().json())', () => {
    const body = { success: false, error: { code: 'VALIDATION_ERROR', message: 'Title is required' } };
    expect(getApiError(body)).toMatchObject({ code: 'VALIDATION_ERROR', message: 'Title is required' });
  });

  it('falls back for null / unknown input', () => {
    expect(getApiError(undefined, 'Oops')).toEqual({ code: CLIENT_ERROR_CODES.UNKNOWN_ERROR, message: 'Oops' });
  });

  it('knows the contract codes', () => {
    expect(isKnownErrorCode('ACCOUNT_SUSPENDED')).toBe(true);
    expect(isKnownErrorCode('NOT_A_REAL_CODE')).toBe(false);
  });

  it('builds a { success: false } result carrying the server message both ways', () => {
    const err = axiosError(403, { success: false, error: { code: 'FORBIDDEN', message: 'Not your listing' } });
    expect(toApiFailure(err, 'fallback')).toEqual({
      success: false,
      message: 'Not your listing',
      error: { code: 'FORBIDDEN', message: 'Not your listing', details: undefined, status: 403 },
    });
  });
});
