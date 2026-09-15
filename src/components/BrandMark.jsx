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
      <span className="font-devanagari text-[1.25em] align-[-0.06em] bg-gradient-to-br from-gold-400 to-gold-500 bg-clip-text text-transparent">
        द
      </span>{' '}
      OG Swaad
    </span>
  )
}
