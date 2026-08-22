import { apiClient } from './client';

/**
 * Address lookup for the create-listing flows.
 *
 * Listings are geocoded server-side from their address either way, but picking a
 * suggestion here pins the property precisely rather than leaving it to a
 * best-guess geocode of free text. The coordinates travel with the listing
 * payload and take precedence over the server's own geocoding.
 *
 * These proxy Google through our backend — authenticated and rate-limited — so
 * debounce input rather than calling per keystroke.
 */

export interface PlacePrediction {
  description: string;
  placeId: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export const mapsApi = {
  async autocomplete(input: string): Promise<PlacePrediction[]> {
    if (!input || input.trim().length < 2) return [];
    try {
      const response = await apiClient.get<{ success: boolean; data: PlacePrediction[] }>(
        `/maps/autocomplete?input=${encodeURIComponent(input.trim())}`
      );
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  async geocode(address: string): Promise<GeocodeResult | null> {
    if (!address?.trim()) return null;
    try {
      const response = await apiClient.get<{ success: boolean; data: GeocodeResult }>(
        `/maps/geocode?address=${encodeURIComponent(address.trim())}`
      );
      return response.data.data || null;
    } catch {
      // An unresolvable address is not an error: the server retries on save and
      // the listing is still valid without coordinates.
      return null;
    }
  },
};

export default mapsApi;
