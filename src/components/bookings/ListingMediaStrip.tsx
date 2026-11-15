/**
 * A booking's listing photos and videos, swipeable, the same way the Listings page shows them.
 * The booking details used to show none of the listing's media at all.
 */
const VIDEO_URL = /\.(mp4|mov|webm|m4v|3gp)(\?.*)?$/i;

export function ListingMediaStrip({ images, title }: { images?: string[]; title?: string }) {
  const media = (images || []).filter((u) => typeof u === 'string' && u.trim());
  if (!media.length) return null;
  return (
    <div className="relative w-full h-48 flex overflow-x-auto snap-x snap-mandatory rounded-clay-sm scrollbar-hide border border-clay-border bg-black/5">
      {media.map((url, index) => (
        <div key={`${url}-${index}`} className="w-full flex-none snap-center h-full relative">
          {VIDEO_URL.test(url) ? (
            <video src={url} controls playsInline preload="metadata" className="w-full h-full object-cover" />
          ) : (
            <img src={url} alt={`${title || 'Listing'} ${index + 1}`} loading="lazy" className="w-full h-full object-cover" />
          )}
          {media.length > 1 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold">
              {index + 1}/{media.length}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
