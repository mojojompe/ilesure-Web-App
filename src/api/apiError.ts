import { ERROR_CODES, isErrorEnvelope } from '../contracts/generated';
import type { ErrorCode } from '../contracts/generated';

/**
 * The one place the app reads an error out of a failed request.
 *
 * The backend answers every error with `{ success: false, error: { code, message, details? } }`
 * (see contracts/generated.ts). Structured context such as `retryAfter`, `daysRemaining`,
 * `expiresAt` or `requiresAction` lives in `details`, never at the top level of the body.
 * Call `getApiError(err)` in a catch block instead of digging through `err.response.data`.
 *
 * Tolerated inputs, in order: an `ApiRequestError` (passed through), an axios-style error with
 * a response (envelope, legacy `{ error: 'text' }` / `{ message }` bodies), an axios-style error
 * without a response (network failure / timeout), any other Error, anything else.
 */

/** Codes produced on the client when the server never answered or answered unparseably. */
export const CLIENT_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Every contract error code keyed by itself, so comparisons are checked against ERROR_CODES at
 * compile time: `apiError.code === ERROR_CODE.RESEND_TOO_SOON`.
 */
export const ERROR_CODE = Object.freeze(
  Object.fromEntries(ERROR_CODES.map((code) => [code, code]))
) as { readonly [K in ErrorCode]: K };

export interface ApiError {
  code: ErrorCode | (string & {});
  message: string;
  details?: unknown;
  /** HTTP status, when the server answered. */
  status?: number;
}

/** Throwable form of an ApiError, for services that rethrow the extracted error. */
export class ApiRequestError extends Error implements ApiError {
  code: ApiError['code'];
  details?: unknown;
  status?: number;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.details = error.details;
    this.status = error.status;
  }
}

export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const NETWORK_ERROR_MESSAGE = 'We could not reach iléSure. Check your connection and try again.';

function codeForStatus(status: number | undefined): string {
  if (status === undefined) return CLIENT_ERROR_CODES.UNKNOWN_ERROR;
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER_ERROR';
  return CLIENT_ERROR_CODES.UNKNOWN_ERROR;
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** Read a response body of any shape the API has ever sent. */
function fromBody(body: unknown, status: number | undefined, fallbackMessage: string): ApiError {
  if (isErrorEnvelope(body)) {
    const { code, message, details } = body.error;
    return { code, message: nonEmpty(message) ?? fallbackMessage, details, status };
  }

  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const legacy = b.error;
  if (legacy && typeof legacy === 'object') {
    // `{ error: { code?, message?, details? } }` without `success: false`.
    const e = legacy as Record<string, unknown>;
    return {
      code: nonEmpty(e.code) ?? codeForStatus(status),
      message: nonEmpty(e.message) ?? nonEmpty(b.message) ?? fallbackMessage,
      details: e.details,
      status,
    };
  }

  return {
    code: nonEmpty(b.code) ?? codeForStatus(status),
    // `{ error: 'text' }` or `{ message: 'text' }`. A raw string body (an HTML error page from a
    // proxy, say) is not shown to users.
    message: nonEmpty(legacy) ?? nonEmpty(b.message) ?? fallbackMessage,
    status,
  };
}

export function getApiError(err: unknown, fallbackMessage: string = DEFAULT_ERROR_MESSAGE): ApiError {
  if (err instanceof ApiRequestError) {
    return { code: err.code, message: err.message || fallbackMessage, details: err.details, status: err.status };
  }

  const e = err && typeof err === 'object' ? (err as Record<string, any>) : null;

  if (e && e.response && typeof e.response === 'object') {
    const status = typeof e.response.status === 'number' ? e.response.status : undefined;
    return fromBody(e.response.data, status, fallbackMessage);
  }

  // An axios error with no response: offline, DNS, CORS, timeout.
  if (e && (e.isAxiosError === true || e.request !== undefined)) {
    return { code: CLIENT_ERROR_CODES.NETWORK_ERROR, message: NETWORK_ERROR_MESSAGE };
  }

  // An already-parsed body handed over directly (e.g. from fetch().json()).
  if (e && ('success' in e || 'error' in e) && !(err instanceof Error)) {
    return fromBody(e, undefined, fallbackMessage);
  }

  if (err instanceof Error) {
    return {
      code: nonEmpty((err as { code?: unknown }).code) ?? CLIENT_ERROR_CODES.UNKNOWN_ERROR,
      message: nonEmpty(err.message) ?? fallbackMessage,
    };
  }

  return { code: CLIENT_ERROR_CODES.UNKNOWN_ERROR, message: nonEmpty(err) ?? fallbackMessage };
}

/** Shorthand for the text to show a user. */
export function getApiErrorMessage(err: unknown, fallbackMessage?: string): string {
  return getApiError(err, fallbackMessage).message;
}

/** Whether a failed request was refused with this (contract-checked) code. */
export function hasErrorCode(err: unknown, code: ErrorCode): boolean {
  return getApiError(err).code === code;
}

/** Whether a code string is one the API contract defines. */
export function isKnownErrorCode(code: unknown): code is ErrorCode {
  return typeof code === 'string' && (ERROR_CODES as readonly string[]).includes(code);
}

/** Read one field of `error.details` when details is an object. */
export function getErrorDetail<T = unknown>(err: unknown, key: string): T | undefined {
  const { details } = getApiError(err);
  if (!details || typeof details !== 'object' || Array.isArray(details)) return undefined;
  return (details as Record<string, unknown>)[key] as T | undefined;
}

/**
 * The failure half of the `{ success, ... }` result convention the API modules return instead
 * of throwing. Carries the extracted error under `error` and its text under `message`, so both
 * `result.error.message` and `result.message` readers see the server's wording.
 */
export interface ApiFailure {
  success: false;
  error: ApiError;
  message: string;
}

export function toApiFailure(err: unknown, fallbackMessage?: string): ApiFailure {
  const error = getApiError(err, fallbackMessage);
  return { success: false, error, message: error.message };
}
