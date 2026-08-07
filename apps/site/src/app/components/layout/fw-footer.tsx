import { Link } from 'react-router'
import { WolfMark } from '@fw/ui'
import { siteUrl } from '@/consts'
// Parked while we zoom in on the core loop — restore alongside the fuller
// footer below:
// import { Globe } from 'lucide-react'
// import type { ComponentType } from 'react'
// import {
//   DiscordIcon,
//   GitHubIcon,
//   XIcon,
//   YouTubeIcon,
// } from '@/components/auth/brand-icons'

// FW-01 marketing footer — redesigned around the core loop: Akela's creed and
// the terminal readout over the skyline, then a slim brand + nav + status row.
// The fuller footer (link columns, social row, copyright) is commented out at
// the bottom — we're focused on the main flow and will resurface it later.
const NAV: [string, string][] = [
  ['How It Works', '/how-it-works'],
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['Blog', '/blog'],
  ['About Us', '/about'],
]

// Parked — the full three-column link set + socials (the new nav row above is a
// curated subset). Restore when we widen the footer scope again.
// const COLS: { title: string; links: [string, string][] }[] = [
//   {
//     title: 'Platform',
//     links: [
//       ['How It Works', '/how-it-works'],
//       ['Features', '/features'],
//       ['Pricing', '/pricing'],
//       ['Games We Support', '#'],
//     ],
//   },
//   {
//     title: 'Resources',
//     links: [
//       ['Blog', '/blog'],
//       ['Guides', '#'],
//       ['Help Center', '#'],
//       ['Community', '#'],
//     ],
//   },
//   {
//     title: 'Company',
//     links: [
//       ['About Us', '/about'],
//       ['Careers', '#'],
//       ['Privacy Policy', '#'],
//       ['Terms of Service', '#'],
//     ],
//   },
// ]
//
// const SOCIALS: [ComponentType<{ className?: string }>, string][] = [
//   [DiscordIcon, 'Discord'],
//   [XIcon, 'X'],
//   [YouTubeIcon, 'YouTube'],
//   [GitHubIcon, 'GitHub'],
// ]

export function FwFooter() {
  return (
    <footer className="text-muted-foreground">
      {/* The skyline creed + terminal band moved into the guest homepage as
          `<CreedBand />` (a bordered card under the session launcher); the
          footer is now just the slim status bar. */}

      {/* Slim brand + nav row. No top rule — the tiles above it already close
          the page with their own edges. Kept in sync with Base.astro. */}
      <div>
        <div className="mx-auto flex max-w-page flex-col items-center gap-5 px-5 py-6 md:flex-row md:justify-between md:gap-8 md:px-8">
          <Link
            to="/"
            aria-label="Fullstack Wolfpack home"
            className="flex items-center gap-2.5"
          >
            {/* Light takes `text-foreground` like the header's; dark runs it
                red, so the mark and the kana beside it read as one lockup
                rather than a grey glyph next to a primary word — the same move
                the join row's mark makes. */}
            <WolfMark className="h-6 text-foreground dark:text-primary" />
            <span className="font-mono text-base font-bold text-primary">
              ウルフパック
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {NAV.map(([label, to]) => (
              <a
                key={label}
                href={siteUrl(to)}
                className="font-mono text-[11px] tracking-wide text-foreground/80 transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          {/* Status readout — all one muted color; each item reads as a phrase,
              not a key/value pair. */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              API
              <span className="size-1.5 rounded-full bg-green-500" />
              <span className="text-blue-600 dark:text-blue-400">Healthy</span>
            </span>
            <span>Build v0.1.0</span>
            <span>Deployed 2h ago</span>
            <span>Env: Production</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Parked — the fuller footer (tagline, link columns, terminal cell,
          social row, copyright). Restore when we widen scope again.
      <div className="mx-auto max-w-page px-5 pt-14 pb-8 md:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <WolfMark className="h-9 text-white" />
            <span className="font-mono text-lg font-bold text-primary">
              ウルフパック
            </span>
          </div>
          <p className="max-w-[15rem] font-mono text-xs leading-relaxed">
            Fullstack Wolfpack helps gamers level up in game and in life.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {COLS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="font-mono text-[11px] font-bold tracking-widest text-white uppercase">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <a
                      href={to.startsWith('/') ? siteUrl(to) : to}
                      className="font-mono text-xs text-neutral-400 transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="relative flex flex-col border border-neutral-700 p-4 pt-6 sm:max-w-[15rem] xl:max-w-none">
            <div className="flex flex-col gap-1.5 font-mono text-xs tracking-wide text-neutral-200">
              <span>&gt; LOCK IN</span>
              <span>&gt; KEEP LEARNING</span>
              <span>&gt; KEEP LEVELING UP</span>
            </div>
            <div className="fw-barcode mt-8 h-3 w-full text-neutral-600" />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-neutral-800 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            {SOCIALS.map(([Icon, label]) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="text-neutral-500 transition-colors hover:text-white"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            <span>© {new Date().getFullYear()} Fullstack Wolfpack · All rights reserved</span>
            <Globe className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
          </div>
        </div>
      </div>
      */}
    </footer>
  )
}
