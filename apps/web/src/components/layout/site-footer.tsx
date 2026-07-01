import { Link } from 'react-router'
import { Logo } from '@fw/ui'

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Platform',
    links: [
      ['How It Works', '/how-it-works'],
      ['Features', '/features'],
      ['Pricing', '/pricing'],
      ['Games We Support', '/features'],
    ],
  },
  {
    title: 'Resources',
    links: [
      ['Blog', '/blog'],
      ['Guides', '/blog'],
      ['Help Center', '/about'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About Us', '/about'],
      ['Careers', '/about'],
      ['Privacy Policy', '/about'],
      ['Terms of Service', '/about'],
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo className="text-background" />
          <p className="mt-3 font-mono text-xs text-background/70">
            Turn screen time into real world skills.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="font-mono text-xs tracking-widest uppercase">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="font-mono text-xs text-background/70 hover:text-background"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-background/20 px-6 py-3 text-center font-mono text-[10px] tracking-widest text-background/50 uppercase">
        © 2025 Fullstack Wolfpack · All rights reserved
      </div>
    </footer>
  )
}
