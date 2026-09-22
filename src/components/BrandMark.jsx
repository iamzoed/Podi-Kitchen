import { shopInfo } from '../data/menu'

// Renders the shop name with "द" as a decorative gold-accent glyph — the
// same treatment the old ampersand had — instead of it falling back to a
// generic system font for the Devanagari character. Reads shopInfo itself
// so every usage stays correct if the name in src/data/menu.js changes;
// falls back to plain text for any name that isn't exactly "द OG Swaad".
export default function BrandMark({ className = '' }) {
  if (shopInfo.name !== 'द OG Swaad') {
    return <span className={className}>{shopInfo.name}</span>
  }
  return (
    <span className={className}>
      {/* mr (not a text space) keeps deliberate, consistent breathing room
          between "द" and "OG" at every size — a plain space was too tight
          and let it misread as one word ("Dog Swaad") instead of a
          Devanagari mark followed by the Latin wordmark. */}
      <span className="font-devanagari text-[1.35em] mr-[0.2em] align-[-0.05em] bg-gradient-to-br from-gold-400 to-gold-500 bg-clip-text text-transparent drop-shadow-[0_1px_8px_rgba(232,121,31,0.4)]">
        द
      </span>
      OG Swaad
    </span>
  )
}
