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
// the terminal readout over the skyline, then a slim brand + nav row. The
// fuller footer (link columns, social row, copyright) is commented out at the
// bottom — we're focused on the main flow and will resurface it later.
// Parked with the nav row below — bottom-right links are hidden for now, just a
// copyright. Restore both together.
// const NAV: [string, string][] = [
//   ['How It Works', '/how-it-works'],
//   ['Features', '/features'],
//   ['Pricing', '/pricing'],
//   ['Blog', '/blog'],
//   ['About Us', '/about'],
// ]

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
    <footer className="bg-background text-muted-foreground">
      {/* Skyline band — Akela's creed + the terminal readout over the city.
          The band stays dark in both themes (it's a photograph; light text over
          it reads in either mode) — only the chrome around it flips. */}
      <div className="relative overflow-hidden">
        <img
          src="/images/footer-2.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Scrims: an overall darken, a heavier left wash for the quote, and a
            bottom fade into the nav row. */}
        <div className="absolute inset-0 bg-neutral-950/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/50 to-transparent" />
        {/* Fades the image's lower edge into the nav row — `background` so it
            blends in both themes. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto flex min-h-[7.5rem] max-w-7xl flex-col justify-center gap-8 px-5 py-6 md:min-h-[9.5rem] md:flex-row md:items-center md:justify-between md:px-8">
          {/* Akela's creed */}
          <blockquote className="max-w-md">
            <span
              aria-hidden="true"
              className="block font-heading text-6xl leading-none text-primary"
            >
              &ldquo;
            </span>
            <p className="-mt-4 font-mono text-sm leading-relaxed text-neutral-100 sm:text-base">
              Discipline is choosing between what you want now and what you want
              most.
            </p>
            <cite className="mt-3 block font-mono text-xs tracking-widest text-primary uppercase not-italic">
              — Akela
            </cite>
          </blockquote>

          {/* Terminal readout */}
          <div className="fw-notch-tr w-full max-w-[15rem] shrink-0 border border-neutral-700 bg-neutral-950/70 p-4 pt-6 backdrop-blur-sm">
            <div className="flex flex-col gap-2 font-mono text-sm tracking-wide">
              <span className="text-primary">&gt; LOCK IN</span>
              <span className="text-green-500">&gt; KEEP LEARNING</span>
              <span className="text-primary">&gt; LEVEL UP</span>
            </div>
            <div className="fw-barcode mt-6 h-3 w-full text-neutral-600" />
          </div>
        </div>
      </div>

      {/* Slim brand + nav row */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 py-6 md:flex-row md:justify-between md:px-8">
          <a
            href={siteUrl()}
            aria-label="Fullstack Wolfpack home"
            className="flex items-center gap-2.5"
          >
            <WolfMark className="h-8 text-primary" />
            <span className="font-mono text-lg font-bold text-primary">
              ウルフパック
            </span>
          </a>
          {/* Nav links parked while we focus the flow — just a copyright for now.
          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {NAV.map(([label, to]) => (
              <a
                key={label}
                href={siteUrl(to)}
                className="font-mono text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          */}
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            &copy; 2026
          </span>
        </div>
      </div>

      {/* Parked — the fuller footer (tagline, link columns, terminal cell,
          social row, copyright). Restore when we widen scope again.
      <div className="mx-auto max-w-7xl px-5 pt-14 pb-8 md:px-8">
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
