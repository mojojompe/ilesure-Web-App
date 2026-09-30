import { describe, it, expect, vi, beforeEach } from 'vitest';

// The module's default adapter is the real HTTP client; these tests always pass their own.
vi.mock('./client', () => ({ default: {}, apiClient: {} }));

import { createOwnerApi, normalizeListing, toFailure, type OwnerHttp } from './owner';

type Call = { method: string; url: string; body?: unknown };

/** An in-memory HTTP adapter: records calls, answers from a route table or throws. */
function stubHttp(routes: Record<string, unknown | ((call: Call) => unknown)>) {
  const calls: Call[] = [];
  const handle = async (method: string, url: string, body?: unknown) => {
    const call = { method, url, body };
    calls.push(call);
    const key = `${method} ${url}`;
    if (!(key in routes)) throw new Error(`unexpected request ${key}`);
    const answer = routes[key];
    const data = typeof answer === 'function' ? (answer as (c: Call) => unknown)(call) : answer;
    return { data };
  };
  const http: OwnerHttp = {
    get: (url) => handle('GET', url) as any,
    post: (url, body) => handle('POST', url, body) as any,
    put: (url, body) => handle('PUT', url, body) as any,
    delete: (url) => handle('DELETE', url) as any,
    upload: (url, body) => handle('UPLOAD', url, body) as any,
  };
  return { http, calls };
}

function axiosError(status: number, error: unknown) {
  return () => {
    throw Object.assign(new Error(`Request failed with status code ${status}`), {
      response: { status, data: { success: false, error } },
    });
  };
}

describe('owner API: endpoint prefix comes from role', () => {
  it.each([
    ['agent', 'PUT /agent/listings/l1/archive'],
    ['company', 'PUT /company/listings/l1/archive'],
  ] as const)('%s archives through its own prefix', async (role, route) => {
    const { http, calls } = stubHttp({ [route]: { success: true, data: { _id: 'l1', rentAnnual: 5 } } });
    const result = await createOwnerApi(role, http).archiveListing('l1');
    expect(result.success).toBe(true);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([route]);
  });

  it.each([
    ['agent', 'PUT /agent/bookings/b1'],
    ['company', 'PUT /company/bookings/b1'],
  ] as const)('%s decides a booking via PUT /{role}/bookings/:id with the decision as status', async (role, route) => {
    const { http, calls } = stubHttp({ [route]: { success: true, data: { _id: 'b1', status: 'rejected' } } });
    const result = await createOwnerApi(role, http).decideBooking('b1', 'rejected');
    expect(result).toMatchObject({ success: true, data: { status: 'rejected' } });
    expect(calls[0].body).toEqual({ status: 'rejected' });
  });

  it('sends permanent deletes with ?permanent=true (company uses the shared /agent handler)', async () => {
    const { http, calls } = stubHttp({ 'DELETE /agent/listings/l9?permanent=true': { success: true, permanent: true } });
    const result = await createOwnerApi('company', http).deleteListing('l9', true);
    expect(result).toEqual({ success: true, data: { permanent: true }, message: undefined } as any);
    expect(calls).toHaveLength(1);
  });

  it('shares role-agnostic inspection endpoints', async () => {
    const { http, calls } = stubHttp({ 'POST /bookings/b1/inspection/missed': { success: true, data: { _id: 'b1' } } });
    await createOwnerApi('company', http).markInspectionMissed('b1');
    expect(calls[0].url).toBe('/bookings/b1/inspection/missed');
  });
});

describe('owner API: one result convention', () => {
  it('turns an HTTP error into a failure carrying the server message, details, code and status', async () => {
    const { http } = stubHttp({
      'POST /company/listings': axiosError(400, { code: 'VALIDATION', message: 'Invalid listing', details: ['rentAnnual too low'] }),
    });
    const result = await createOwnerApi('company', http).createListing({});
    expect(result).toEqual({
      success: false,
      error: { message: 'Invalid listing', details: ['rentAnnual too low'], code: 'VALIDATION', status: 400 },
    });
  });

  it('falls back to an operation-specific message when the server gives none', async () => {
    const { http } = stubHttp({ 'GET /agent/subaccount': axiosError(500, undefined) });
    const result = await createOwnerApi('agent', http).getSubaccount();
    expect(result).toEqual({
      success: false,
      error: { message: 'Failed to fetch subaccount', code: 'SERVER_ERROR', status: 500 },
    });
  });

  it('reports a network failure (no response) as NETWORK_ERROR', async () => {
    const { http } = stubHttp({
      'GET /agent/subaccount': () => {
        throw Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} });
      },
    });
    const result = await createOwnerApi('agent', http).getSubaccount();
    expect(result).toMatchObject({ success: false, error: { code: 'NETWORK_ERROR' } });
  });

  it('treats a 200 body with success:false as a failure', async () => {
    const { http } = stubHttp({ 'PUT /agent/listings/l1/restore': { success: false, error: { message: 'Slot limit reached' } } });
    const result = await createOwnerApi('agent', http).restoreListing('l1');
    expect(result).toMatchObject({ success: false, error: { message: 'Slot limit reached' } });
  });

  it('returns pointsAwarded from mark-rented alongside the listing', async () => {
    const { http, calls } = stubHttp({
      'PUT /company/listings/l1/mark-rented': { success: true, data: { _id: 'l1', rentAnnual: 1 }, pointsAwarded: 25 },
    });
    const result = await createOwnerApi('company', http).markListingRented('l1', 'rented_on_platform');
    expect(calls[0].body).toEqual({ reason: 'rented_on_platform' });
    expect(result.success && result.data.pointsAwarded).toBe(25);
  });
});

describe('owner API: listings are normalised at the seam', () => {
  let routes: Record<string, unknown>;
  beforeEach(() => {
    routes = {
      'GET /company/listings': {
        success: true,
        data: {
          listings: [
            { id: 'a', title: 'Flat A', price: 300000, status: 'active' },
            { _id: 'b', title: 'Room B', rentAnnual: 150000, status: 'archived' },
          ],
          pagination: { currentPage: 1, totalPages: 1, totalItems: 2 },
        },
      },
    };
  });

  it('gives every listing both price fields and both id fields', async () => {
    const { http } = stubHttp(routes);
    const result = await createOwnerApi('company', http).getListings();
    if (!result.success) throw new Error('expected success');
    expect(result.data.listings.map((l) => [l._id, l.id, l.rentAnnual, l.price])).toEqual([
      ['a', 'a', 300000, 300000],
      ['b', 'b', 150000, 150000],
    ]);
    expect(result.data.pagination?.totalItems).toBe(2);
  });

  it('filters company listings locally, since that endpoint ignores status and search', async () => {
    const { http, calls } = stubHttp(routes);
    const result = await createOwnerApi('company', http).getListings({ status: 'archived' });
    expect(calls[0].url).toBe('/company/listings');
    expect(result.success && result.data.listings.map((l) => l.id)).toEqual(['b']);
  });

  it('passes agent filters to the server', async () => {
    const { http, calls } = stubHttp({ 'GET /agent/listings?status=active&search=flat': { success: true, data: { listings: [] } } });
    await createOwnerApi('agent', http).getListings({ status: 'active', search: 'flat' });
    expect(calls).toHaveLength(1);
  });

  it('unwraps both detail shapes ({data:{listing}} and {data})', async () => {
    const agent = stubHttp({ 'GET /agent/listings/x': { success: true, data: { listing: { _id: 'x', annualRent: 7 } } } });
    const company = stubHttp({ 'GET /listings/x': { success: true, data: { _id: 'x', price: 7 } } });
    const a = await createOwnerApi('agent', agent.http).getListing('x');
    const c = await createOwnerApi('company', company.http).getListing('x');
    expect(a.success && a.data.rentAnnual).toBe(7);
    expect(c.success && c.data.rentAnnual).toBe(7);
  });

  it('normalizeListing tolerates a listing with no price at all', () => {
    expect(normalizeListing({ _id: 'z' })).toMatchObject({ id: 'z', rentAnnual: 0, price: 0 });
  });
});

describe('toFailure', () => {
  it('accepts a bare string error body', () => {
    expect(toFailure({ response: { status: 500, data: { error: 'boom' } } }, 'x')).toEqual({
      success: false,
      error: { message: 'boom', code: 'SERVER_ERROR', status: 500 },
    });
  });

  it('renders VALIDATION_ERROR field details as display lines', () => {
    const err = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some fields are missing or invalid.',
            details: [{ field: 'title', message: 'is required' }, 'Price must be positive'],
          },
        },
      },
    };
    expect(toFailure(err, 'x').error).toEqual({
      message: 'Some fields are missing or invalid.',
      details: ['title: is required', 'Price must be positive'],
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  });
});
