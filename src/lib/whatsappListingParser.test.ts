import { describe, it, expect } from 'vitest';
import { parseListingMessage, findMoney, cleanMessage, suggestTitle } from './whatsappListingParser';

const NEXGEN = `[15:50, 11/13/2026] NEXGEN TV: Direct letting,  5 unit of Room self con and 1 unit of Room and palour self con Toll gate very close to  lead City University ibadan oyo state Nigeria,
Rent 800k
Room and palour 1.2m
Proposed November 15/30. Cabinet and painting on going.. Secure or instants excecusion is allowed.
[15:51, 11/13/2026] NEXGEN TV: Plus video`;

describe('parseListingMessage: the NEXGEN post', () => {
  const parsed = parseListingMessage(NEXGEN);

  it('splits it into a self con and a room and parlour with their own rents', () => {
    expect(parsed.units).toEqual([
      { propertyType: 'self_con', label: 'Self-con', count: 5, rent: 800_000 },
      { propertyType: 'mini_flat', label: 'Room and parlour', count: 1, rent: 1_200_000 },
    ]);
  });

  it('finds the place', () => {
    expect(parsed.area).toBe('Toll Gate');
    expect(parsed.landmark).toBe('Lead City University');
    expect(parsed.city).toBe('Ibadan');
    expect(parsed.distance).toBe('very_close');
  });

  it('keeps the post as the description without the WhatsApp clutter', () => {
    expect(parsed.description).not.toMatch(/NEXGEN|15:50|Plus video/);
    expect(parsed.description).toMatch(/^Direct letting/);
    expect(parsed.description).toMatch(/Proposed November 15\/30/);
  });

  it('reads cabinets as a kitchen and leaves unknown utilities blank', () => {
    expect(parsed.amenities).toContain('kitchen');
    expect(parsed.furnishing).toBeUndefined();
    expect(parsed.power).toBeUndefined();
    expect(parsed.water).toBeUndefined();
    expect(parsed.warnings).toEqual([]);
  });
});

describe('parseListingMessage: other shapes', () => {
  it('reads a plain one-liner', () => {
    const p = parseListingMessage('Self contain at Agbowo, 350k per annum, borehole, prepaid meter, very close to UI');
    expect(p.units).toEqual([{ propertyType: 'self_con', label: 'Self-con', count: undefined, rent: 350_000 }]);
    expect(p.area).toBe('Agbowo');
    expect(p.landmark).toBe('University of Ibadan');
    expect(p.water).toBe('borehole');
    expect(p.amenities).toContain('prepaid_meter');
    expect(p.distance).toBe('very_close');
  });

  it('separates caution and agency fees from rent', () => {
    const p = parseListingMessage('2 bedroom flat Bodija\nRent: ₦1,500,000\nCaution: 150k\nAgency 10%\nFully furnished, solar');
    expect(p.units[0]).toMatchObject({ propertyType: '2_bed', rent: 1_500_000 });
    expect(p.cautionFee).toBe(150_000);
    expect(p.agencyFee).toEqual({ percent: 10 });
    expect(p.furnishing).toBe('fully_furnished');
    expect(p.power).toBe('solar_backed');
  });

  it('reads service charge and inspection fee without mistaking them for rent', () => {
    const p = parseListingMessage('Mini flat at Akobo\nRent 650k\nService charge 50k\nInspection fee: 5,000');
    expect(p.units[0].rent).toBe(650_000);
    expect(p.serviceCharge).toBe(50_000);
    expect(p.inspectionFee).toBe(5_000);
  });

  it('turns a monthly price into a yearly rent and says so', () => {
    const p = parseListingMessage('Mini flat in Sango 50k monthly');
    expect(p.units[0].rent).toBe(600_000);
    expect(p.warnings.join(' ')).toMatch(/monthly/);
  });

  it('removes phone numbers and warns', () => {
    const p = parseListingMessage('Self con Apete 250k. Call 08031234567');
    expect(p.description).not.toMatch(/0803/);
    expect(p.warnings.join(' ')).toMatch(/phone number/);
  });

  it('falls back to self con and asks for a check when no type is named', () => {
    const p = parseListingMessage('Available at Ojoo for 300k');
    expect(p.units[0]).toMatchObject({ propertyType: 'self_con', rent: 300_000 });
    expect(p.area).toBe('Ojoo');
    expect(p.warnings.join(' ')).toMatch(/property type/);
  });

  it('reads gender rules', () => {
    expect(parseListingMessage('Hostel room for female students only, Ajibode 180k').gender).toBe('female_only');
  });
});

describe('findMoney', () => {
  it('reads Nigerian price shorthand and skips dates and counts', () => {
    expect(findMoney('Rent 800k, R&P 1.2m, N450,000, #90k, 1.5 million').map((m) => m.value)).toEqual([
      800_000, 1_200_000, 450_000, 90_000, 1_500_000,
    ]);
    expect(findMoney('5 units, November 15/30, 2026, 15:50')).toEqual([]);
  });
});

describe('cleanMessage', () => {
  it('strips both WhatsApp export formats', () => {
    expect(cleanMessage('11/13/26, 3:50 PM - Tunde Agent: Self con at Orogun').text).toBe('Self con at Orogun');
    expect(cleanMessage('[15:50, 11/13/2026] NEXGEN TV: Self con').text).toBe('Self con');
  });
});

describe('suggestTitle', () => {
  it('names the type, area and landmark', () => {
    expect(suggestTitle({ label: 'Self-con' }, 'Toll Gate', 'Lead City University')).toBe('Self-con at Toll Gate, near Lead City University');
    expect(suggestTitle({ label: 'Room and parlour' })).toBe('Room and parlour');
  });
});
