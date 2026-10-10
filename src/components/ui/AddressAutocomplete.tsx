import { useState, useEffect, useRef } from 'react';
import { Location01Icon, Loading02Icon, Tick02Icon } from '@hugeicons/react';
import { mapsApi, PlacePrediction } from '../../api/maps';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Fired when a suggestion is picked and resolves to a point.
   * Coordinates are GeoJSON order: [longitude, latitude].
   */
  onSelectCoordinates: (coordinates: [number, number] | null) => void;
  placeholder?: string;
  /** The listing's city; suggestions are limited to around it once known. */
  city?: string;
}

/**
 * Address field with Google-backed suggestions.
 *
 * Picking a suggestion pins the property exactly. Typing free text and moving on
 * still works, the backend geocodes the address on save, so this never blocks
 * the wizard, it just produces a better pin when used.
 *
 * A suggestion only replaces the text when it completes what was typed ("Agbo"
 * -> "Agbowo, Ibadan"). When the lister has typed more detail than Google knows
 * ("No 1 Real Large Street, Elebu" and they pick "Elebu, Ibadan"), their full
 * address is kept and the suggestion is used for the pin only.
 */
export function keepsTypedAddress(typed: string, suggestion: string): boolean {
  const t = typed.trim().toLowerCase();
  return t.length > 0 && !suggestion.trim().toLowerCase().startsWith(t);
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelectCoordinates,
  placeholder = 'Full address, e.g. No 1 Real Large Street, Elebu',
  city,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [pinned, setPinned] = useState(false);
  // Set when the pin came from a suggestion but the typed address was kept.
  const [pinnedTo, setPinnedTo] = useState<string | null>(null);

  const cityRef = useRef(city);
  cityRef.current = city;

  // Skips the lookup for the value we just wrote ourselves after a pick.
  const suppressNextLookup = useRef(false);

  useEffect(() => {
    if (suppressNextLookup.current) {
      suppressNextLookup.current = false;
      return;
    }

    // Any manual edit invalidates a previous pin; the server will re-geocode.
    setPinned(false);
    setPinnedTo(null);
    onSelectCoordinates(null);

    if (value.trim().length < 3) {
      setPredictions([]);
      return;
    }

    let ignore = false;
    setLoading(true);
    // The endpoint is rate-limited and billed per call, so wait for a pause in
    // typing rather than firing on every character.
    const timer = setTimeout(async () => {
      const results = await mapsApi.autocomplete(value, cityRef.current);
      if (ignore) return;
      setPredictions(results);
      setLoading(false);
    }, 400);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
    // onSelectCoordinates is intentionally excluded, the parent recreates it on
    // every render, which would restart the debounce on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handlePick = async (prediction: PlacePrediction) => {
    const keepTyped = keepsTypedAddress(value, prediction.description);
    if (!keepTyped) {
      // Only suppress when the value really changes; otherwise the flag would
      // swallow the lister's next real edit.
      suppressNextLookup.current = prediction.description !== value;
      onChange(prediction.description);
    }
    setPredictions([]);
    setLoading(true);

    const result = await mapsApi.geocode(prediction.description);
    setLoading(false);

    if (result) {
      setPinned(true);
      setPinnedTo(keepTyped ? prediction.description : null);
      onSelectCoordinates([result.lng, result.lat]);
    } else {
      setPinned(false);
      setPinnedTo(null);
      onSelectCoordinates(null);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="clay-input w-full pr-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loading02Icon className="w-4 h-4 animate-spin text-mustard" />
          ) : pinned ? (
            <Tick02Icon className="w-4 h-4 text-status-success" />
          ) : null}
        </div>
      </div>

      {pinned && (
        <p className="mt-1 text-xs text-text-tertiary">
          {pinnedTo
            ? `Location pinned to ${pinnedTo}. Your full address is kept as typed.`
            : 'Exact location pinned, renters searching near a campus will find this listing.'}
        </p>
      )}

      {predictions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-clay-sm border border-clay-border bg-white shadow-clay">
          {predictions.slice(0, 5).map(prediction => (
            <li key={prediction.placeId}>
              <button
                type="button"
                onClick={() => handlePick(prediction)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-clay-border-light"
              >
                <Location01Icon className="w-4 h-4 shrink-0 text-text-tertiary" />
                <span className="truncate">{prediction.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddressAutocomplete;
