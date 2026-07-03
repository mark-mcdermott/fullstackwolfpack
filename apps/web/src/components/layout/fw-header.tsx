import { ArrowRight } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { WolfMark, cn } from '@fw/ui'

// FW-01 marketing header — ported from apps/site Base.astro so the logged-out
// auth pages carry the public site's chrome.
const NAV: [string, string][] = [
  ['How it works', '/how-it-works'],
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['About', '/about'],
]

export function FwHeader() {
  return (
    <header className="bg-neutral-950 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-3">
        <Link to="/" className="flex gap-2.5 md:gap-5">
          <WolfMark className="h-11 text-white md:h-18" />
          <span className="flex flex-col gap-1 font-heading text-[13px] leading-none tracking-wide md:text-[19px]">
            <span>FULLSTACK</span>
            <span>WOLFPACK</span>
            <span className="mt-1 text-[10px] font-normal text-primary md:text-[15px]">
              ウルフパック
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 font-heading text-[12px] tracking-widest uppercase lg:flex">
          {NAV.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'border-b-2 pb-1 transition-colors hover:text-white',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-100',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:grid md:grid-cols-[3fr_4fr]">
          <div className="hidden h-16 flex-col gap-1 border border-neutral-300 px-3 md:flex">
            <div className="mt-2 flex items-center gap-1.5">
              <span className="font-heading font-mono text-[9px] font-bold tracking-tight text-neutral-300 uppercase">
                System status
              </span>
              <span className="mb-0.5 h-1 w-1 rounded-full bg-primary" />
            </div>
            <span className="relative mb-0.5 font-mono text-[9px] font-bold tracking-widest text-primary uppercase">
              Online
            </span>
            <span className="fw-barcode-regular h-2 w-30 text-neutral-500" />
          </div>

          <Link
            to="/signup"
            className="fw-notch-br fw-notch-tr flex h-16 items-center justify-center gap-1.5 bg-primary px-4 py-2.5 font-heading text-xs font-semibold tracking-widest whitespace-nowrap text-primary-foreground uppercase transition-colors hover:bg-primary/90 md:gap-2.5 md:py-6.5 md:pr-4 md:pl-7 md:text-sm"
          >
            Start Learning
            <ArrowRight className="h-4 w-4 md:ml-3 md:h-7 md:w-7" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  )
}
