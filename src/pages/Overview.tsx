import { AlertCircle, ArrowRight, CalendarDays, Circle, CheckCircle2, MapPin, Plus, Sparkles } from 'lucide-react'
import { HERO_IMG, TODAY, daysUntil, fmtDate, money, type PlanEvent } from '../data'
import { budgetTotals, isOverdue } from '../lib'
import { useApp } from '../store'
import { Badge, Button, Card, Eyebrow, Progress, SectionTitle } from '../components/ui'

export function EventCard({ ev }: { ev: PlanEvent }) {
  const { openEvent, progress } = useApp()
  const p = progress(ev.id)
  const d = daysUntil(ev.date)
  return (
    <button onClick={() => openEvent(ev.id)} className="group overflow-hidden rounded-2xl border border-line bg-warm text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(41,40,33,0.35)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-champagne">
        <img src={ev.image} alt={`${ev.type} inspiration for ${ev.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-1.5"><span className="rounded-full bg-warm/95 px-2.5 py-0.5 text-[11.5px] font-medium">{ev.type}</span>{ev.sample && <span className="rounded-full bg-ink/70 px-2.5 py-0.5 text-[11.5px] text-white">Sample</span>}</div>
      </div>
      <div className="p-5">
        <h3 className="text-xl leading-snug">{ev.name}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-soft"><CalendarDays size={14} /> {fmtDate(ev.date)} · {d >= 0 ? `${d} days to go` : 'Past'}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft"><MapPin size={14} /> {ev.location}</p>
        <div className="mt-4 flex items-center justify-between text-xs"><span className="font-medium">Planning progress</span><span>{p}%</span></div>
        <div className="mt-1.5"><Progress value={p} label={`${ev.name} planning progress`} /></div>
      </div>
    </button>
  )
}

export function Overview() {
  const { events, tasks, expenses, setWizardOpen, openEvent, updateTask, profile, go } = useApp()
  const upcoming = [...events].filter((e) => e.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date))
  const ids = new Set(events.map((e) => e.id))
  const open = tasks.filter((t) => !t.done && ids.has(t.eventId)).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6)
  const totals = events.reduce((a, e) => { const b = budgetTotals(e, expenses); return { total: a.total + b.total, spent: a.spent + b.spent } }, { total: 0, spent: 0 })
  const rem = totals.total - totals.spent
  const pct = totals.total ? Math.min(100, Math.round((totals.spent / totals.total) * 100)) : 0
  const first = profile.name.split(' ')[0]

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-ink">
        <img src={HERO_IMG} alt="A candlelit celebration table with glassware" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-transparent" />
        <div className="relative max-w-xl px-6 py-12 text-white sm:px-12 sm:py-16">
          <p className="text-sm text-white/80">Good afternoon, {first}. You have {upcoming.length} events in the works.</p>
          <h1 className="mt-3 text-4xl leading-[1.08] sm:text-5xl">Every memorable event starts with <em className="font-light italic">a plan.</em></h1>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={() => setWizardOpen(true)} className="!bg-white !text-ink hover:!bg-champagne"><Plus size={16} /> Plan a New Event</Button>
            <Button variant="ghost" className="!text-white hover:!bg-white/15" onClick={() => go('events')}>View all events</Button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Coming up" title="Upcoming events" action={<button onClick={() => go('events')} className="flex items-center gap-1 text-sm text-plum hover:underline">See all <ArrowRight size={14} /></button>} />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{upcoming.slice(0, 3).map((e) => <EventCard key={e.id} ev={e} />)}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-6">
          <Eyebrow>Across all events</Eyebrow>
          <h2 className="mt-1 text-2xl">Budget overview</h2>
          <p className="mt-5 font-serif text-4xl">{money(rem)} <span className="font-sans text-sm text-ink-soft">remaining</span></p>
          <div className="mt-4"><Progress value={pct} label="Budget used" /></div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-ink-soft">Total budget</dt><dd className="mt-0.5 text-lg font-medium">{money(totals.total)}</dd></div>
            <div><dt className="text-ink-soft">Estimated spending</dt><dd className="mt-0.5 text-lg font-medium">{money(totals.spent)}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-ink-soft">Spending totals are calculated from the expenses you enter, including planned estimates.</p>
        </Card>

        <Card className="p-6">
          <Eyebrow>Next up</Eyebrow>
          <h2 className="mt-1 text-2xl">Deadlines & open tasks</h2>
          <ul className="mt-4 divide-y divide-line">
            {open.map((t) => {
              const ev = events.find((e) => e.id === t.eventId)!
              const od = isOverdue(t)
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <button aria-label={`Mark "${t.title}" complete`} onClick={() => { updateTask(t.id, { done: true }); }} className="text-ink-soft hover:text-sage-deep"><Circle size={20} /></button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <button onClick={() => openEvent(ev.id, 'Timeline')} className="truncate text-xs text-ink-soft hover:text-plum">{ev.name}</button>
                  </div>
                  {od ? <Badge tone="rose"><AlertCircle size={12} /> Overdue · {fmtDate(t.due, { month: 'short', day: 'numeric' })}</Badge> : <span className="text-xs text-ink-soft">{fmtDate(t.due, { month: 'short', day: 'numeric' })}</span>}
                </li>
              )
            })}
            {!open.length && <li className="flex items-center gap-2 py-6 text-sm text-ink-soft"><CheckCircle2 size={16} className="text-sage" /> All caught up.</li>}
          </ul>
        </Card>
      </div>

      <section className="rounded-3xl bg-blush/60 p-6 sm:p-8">
        <div className="flex items-center gap-2"><Sparkles size={16} className="text-plum" /><Eyebrow>Inspiration · AI-generated suggestions</Eyebrow></div>
        <h2 className="mt-1 text-2xl">Ideas picked for you</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ['e1', 'Ideas', 'Herb-bundle favours', 'Your wedding palette leans sage; rosemary bundles double as décor and favours.'],
            ['e2', 'Ideas', 'Memory-jar toast', 'A low-cost keepsake that suits an intimate 36-person supper.'],
            ['e3', 'Budget', 'Borrow tables from neighbours', 'Community hosts often save on rentals; your rental line is your largest cost.'],
          ].map(([id, tab, t, why]) => (
            <button key={t} onClick={() => openEvent(id, tab as 'Ideas')} className="rounded-2xl bg-warm/90 p-5 text-left transition hover:shadow-md">
              <p className="font-serif text-lg">{t}</p><p className="mt-1.5 text-sm text-ink-soft">{why}</p>
              <p className="mt-3 text-xs text-plum">Suggestion, not a confirmed fact →</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export function MyEvents() {
  const { events, setWizardOpen } = useApp()
  return (
    <div>
      <SectionTitle eyebrow="Your celebrations" title="My Events" action={<Button onClick={() => setWizardOpen(true)}><Plus size={16} /> Create Event</Button>} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{events.map((e) => <EventCard key={e.id} ev={e} />)}</div>
    </div>
  )
}
