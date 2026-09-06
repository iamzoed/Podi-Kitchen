import { Clock, Sparkles } from 'lucide-react'
import { shopInfo } from '../data/menu'
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from './SocialIcons'
import MumbaiSkyline from './MumbaiSkyline'

export default function Footer() {
  return (
    <footer className="bg-brick-800 text-brick-50 relative overflow-hidden">
      <MumbaiSkyline className="absolute bottom-0 inset-x-0 w-full h-10 text-white/[0.06] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-5">
        <h2 className="font-heading text-lg font-semibold text-white">About {shopInfo.name}</h2>
        <p className="text-sm text-brick-100 leading-relaxed max-w-xl">{shopInfo.about}</p>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <a
            href={`https://wa.me/${shopInfo.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Chat on WhatsApp
          </a>
          <span className="flex items-center gap-1.5 text-sm text-brick-100">
            <Clock size={15} /> {shopInfo.hours}
          </span>
        </div>

        <div className="pt-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-brick-200 mb-2">Follow us</div>
          <div className="flex items-center gap-3">
            <a
              href={shopInfo.facebookUrl || '#'}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow us on Facebook"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
            >
              <FacebookIcon className="w-5 h-5" />
            </a>
            <a
              href={shopInfo.instagramUrl || '#'}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow us on Instagram"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
            >
              <InstagramIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-1.5 text-xs text-brick-200">
          <span>Made with ❤️ in {shopInfo.city}</span>
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-gold-400" />
            Developed by <span className="font-semibold text-white">Zoed Shaikh</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
