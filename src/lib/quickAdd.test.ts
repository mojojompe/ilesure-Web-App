import { describe, it, expect } from 'vitest';
import { cardsFromMessage, cardProblem, FALLBACK_DEFAULTS, splitMedia } from './quickAdd';
import { parseListingMessage } from './whatsappListingParser';
import { buildListingPayload } from './listingWizard';

const photo = (name: string) => new File(['x'], name, { type: 'image/jpeg' });
const video = new File(['x'], 'walk.mp4', { type: 'video/mp4' });

describe('cardsFromMessage', () => {
  const parsed = parseListingMessage(
    'Direct letting, 5 unit of Room self con and 1 unit of Room and palour self con Toll gate very close to lead City University ibadan\nRent 800k\nRoom and palour 1.2m'
  );
  const cards = cardsFromMessage(parsed, { ...FALLBACK_DEFAULTS, furnishing: 'semi_furnished' }, { photos: [photo('a.jpg'), photo('b.jpg')], video });

  it('makes one ready-to-publish card per unit type, sharing the media', () => {
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => [c.form.propertyType, c.form.annualRent])).toEqual([['self_con', '800000'], ['mini_flat', '1200000']]);
    expect(cards.every((c) => c.photos.length === 2 && c.video === video)).toBe(true);
    expect(cards.map(cardProblem)).toEqual([null, null]);
  });

  it('fills unmentioned fields from remembered choices and marks them as guesses', () => {
    expect(cards[0].form.furnishing).toBe('semi_furnished');
    expect(cards[0].guessed).toEqual(expect.arrayContaining(['furnishing', 'power', 'water', 'gender']));
    expect(cards[0].guessed).not.toContain('distanceFromSchool');
    expect(cards[0].guessed).not.toContain('city');
  });

  it('builds a payload the backend accepts', () => {
    const payload = buildListingPayload(cards[0].form);
    expect(payload).toMatchObject({
      title: 'Self-con at Toll Gate, near Lead City University',
      rentAnnual: 800000,
      areaCluster: 'Toll Gate',
      address: 'Toll Gate, Ibadan',
      city: 'Ibadan',
      landmark: 'Lead City University',
      distanceBucket: 'very_close',
    });
    expect(String(payload.description)).toMatch(/^5 units of this self-con available/);
  });

  it('needs two photos', () => {
    expect(cardProblem({ ...cards[0], photos: [photo('a.jpg')], video })).toMatch(/at least 2 photos/);
  });

  it('turns an agency percentage into an amount per unit', () => {
    const [c] = cardsFromMessage(parseListingMessage('Self con Agbowo 400k, agency 10%'), FALLBACK_DEFAULTS, { photos: [], video: null });
    expect(c.form.agencyFee).toBe('40000');
  });
});

describe('splitMedia', () => {
  it('separates the video from the photos', () => {
    const a = photo('a.jpg');
    expect(splitMedia([a, video])).toEqual({ photos: [a], video });
  });
});

describe('shortlet posts', () => {
  const cardFor = (post: string) => cardsFromMessage(parseListingMessage(post), FALLBACK_DEFAULTS, { photos: [photo('a.jpg')], video })[0];

  it('keeps a weekly shortlet price weekly instead of charging it per night', () => {
    const card = cardFor('Shortlet apartment at Toll gate close to Lead City University ibadan. 250k per week');
    expect(card.form.propertyType).toBe('shortlet');
    expect(card.form.shortletRates).toEqual([{ label: 'Per week', durationValue: '1', durationUnit: 'week', price: '250000' }]);
  });

  it('reads a plain shortlet price as nightly', () => {
    const card = cardFor('Shortlet apartment at Toll gate close to Lead City University ibadan. 35k per night');
    expect(card.form.shortletRates[0]).toMatchObject({ durationUnit: 'day', price: '35000' });
  });

  it('never sends a caution or agency fee on a shortlet, even one typed before switching type', () => {
    const card = cardFor('Shortlet apartment at Toll gate close to Lead City University ibadan. 35k per night');
    const payload = buildListingPayload({ ...card.form, cautionFee: '50000', agencyFee: '20000', paymentFrequency: 'annually' } as any);
    expect(payload.cautionFee).toBeUndefined();
    expect(payload.agencyFee).toBeUndefined();
    expect(payload.paymentFrequency).toBeUndefined();
  });
});
