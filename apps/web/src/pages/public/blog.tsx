import { PageHeading, Panel, SectionLabel } from '@fw/ui'

const POSTS = [
  { title: 'Building Scalable Systems: Lessons from the Trenches', category: 'System Design', read: 7, excerpt: 'Practical strategies for designing systems that scale with your users and your team.', date: 'May 20, 2025' },
  { title: 'Focus Mode: Deep Work in a Distracted World', category: 'Developer Skills', read: 5, excerpt: 'How to protect your attention and get more done in less time.', date: 'May 15, 2025' },
  { title: 'Decoupling Everything: The Power of Loose Coupling', category: 'System Design', read: 9, excerpt: 'Designing systems that are resilient, maintainable, and easy to evolve.', date: 'May 8, 2025' },
  { title: 'From QA to AI Automation: My Unorthodox Path', category: 'Career', read: 6, excerpt: 'How curiosity, persistence, and saying yes to hard things changed everything.', date: 'Apr 28, 2025' },
  { title: 'Measure. Learn. Iterate. The Feedback Loop That Works', category: 'Developer Skills', read: 4, excerpt: 'Build a personal system for continuous improvement as a developer.', date: 'Apr 21, 2025' },
]

const CATEGORIES: [string, number][] = [
  ['System Design', 24],
  ['Developer Skills', 18],
  ['Productivity', 12],
  ['Career', 9],
  ['Culture', 6],
]

const POPULAR = [
  'The 7 Habits of Highly Effective Developers',
  'Database Indexing Deep Dive',
  'Why Scalability Matters',
  'Technical Debt: The Hidden Tax',
  'API Design Best Practices',
]

const TAGS = ['system-design', 'scalability', 'architecture', 'productivity', 'automation', 'career', 'api', 'databases', 'testing', 'devops', 'ai']

export function Blog() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        label="Blog"
        title="Wolfpack Blog"
        subtitle="Insights, lessons, and field notes from the trenches of software development."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {POSTS.map((p) => (
            <Panel key={p.title} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary uppercase">
                {p.category}
                <span className="text-muted-foreground">· {p.read} min read</span>
              </div>
              <h3 className="text-xl font-bold uppercase">{p.title}</h3>
              <p className="font-mono text-xs text-muted-foreground">
                {p.excerpt}
              </p>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                <span>Mark McDermott · {p.date}</span>
                <span className="text-primary">Read →</span>
              </div>
            </Panel>
          ))}
        </div>
        <aside className="flex flex-col gap-6">
          <Panel>
            <SectionLabel>Categories</SectionLabel>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.map(([name, count]) => (
                <li key={name} className="flex justify-between font-mono text-xs">
                  <span>{name}</span>
                  <span className="text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <SectionLabel>Popular</SectionLabel>
            <ol className="mt-3 space-y-2">
              {POPULAR.map((t, i) => (
                <li key={t} className="flex gap-2 font-mono text-xs">
                  <span className="text-primary">0{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </Panel>
          <Panel>
            <SectionLabel>Tags</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <span
                  key={t}
                  className="border border-border px-2 py-1 font-mono text-[10px] uppercase"
                >
                  {t}
                </span>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
