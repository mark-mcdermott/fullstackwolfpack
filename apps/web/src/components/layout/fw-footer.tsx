import { Globe } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { WolfMark } from '@fw/ui'
import {
  DiscordIcon,
  GitHubIcon,
  XIcon,
  YouTubeIcon,
} from '@/components/auth/brand-icons'

// FW-01 marketing footer — ported from apps/site Base.astro.
const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Platform',
    links: [
      ['How It Works', '/how-it-works'],
      ['Features', '/features'],
      ['Pricing', '/pricing'],
      ['Games We Support', '#'],
    ],
  },
  {
    title: 'Resources',
    links: [
      ['Blog', '/blog'],
      ['Guides', '#'],
      ['Help Center', '#'],
      ['Community', '#'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About Us', '/about'],
      ['Careers', '#'],
      ['Privacy Policy', '#'],
      ['Terms of Service', '#'],
    ],
  },
]

const SOCIALS: [ComponentType<{ className?: string }>, string][] = [
  [DiscordIcon, 'Discord'],
  [XIcon, 'X'],
  [YouTubeIcon, 'YouTube'],
  [GitHubIcon, 'GitHub'],
]

const linkClass =
  'font-mono text-xs text-neutral-400 transition-colors hover:text-white'

function FooterLink({ to, label }: { to: string; label: string }) {
  return to.startsWith('/') ? (
    <Link to={to} className={linkClass}>
      {label}
    </Link>
  ) : (
    <a href={to} className={linkClass}>
      {label}
    </a>
  )
}

export function FwFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-neutral-950 text-neutral-400">
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
                    <FooterLink to={to} label={label} />
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
            <span>© {year} Fullstack Wolfpack · All rights reserved</span>
            <Globe className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </footer>
  )
}
