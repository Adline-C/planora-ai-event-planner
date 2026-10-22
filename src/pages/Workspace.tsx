import type { ReactNode } from 'react'
import { ArrowLeft, Bot, CalendarDays, Flag, MapPin, Sparkles, Trash2, Users } from 'lucide-react'
import { daysUntil, fmtDate, money, type PlanEvent } from '../data'
import { budgetTotals, isOverdue } from '../lib'
import { useApp, type Tab } from '../store'
import { Badge, Button, Card, Eyebrow, Progress, SectionTitle } from '../components/ui'
import { BudgetTab } from '../tabs/BudgetTab'
import { TimelineTab } from '../tabs/TimelineTab'
import { VendorsTab } from '../tabs/VendorsTab'
import { IdeasTab } from '../tabs/IdeasTab'
import { Assistant } from './Assistant'

const TABS: Tab[] = ['Overview', 'Budget', 'Timeline', 'Vendors', 'Ideas']

function OverviewTab({ ev }: { ev: PlanEvent }) {
  const { tasks, expenses, ideas, progress, setTab, updateTask, go } = useApp()
  const mine = tasks.filter((t) => t.eventId === ev.id).sort((a, b) => a.due.localeCompare(b.due))
  const important = mine.filter((t) => !t.done).slice(0, 4)
  const tot = budgetTotals(ev, expenses)
  const recs = ideas.filter((i) => i.eventId === ev.id).slice(0, 3)
  const p = progress(ev.id)
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <Eyebrow>Planning progress</Eyebrow>
        <p className="mt-1 font-serif text-5xl">{p}%</p>
        <div className="mt-3"><Progress value={p} label="Planning progress" /></div>
        <h3 className="mb-3 mt-7 flex items-center gap-2 text-lg"><Flag size={16} className="text-plum" /> Key milestones</h3>
        <ol className="space-y-3">
          {mine.filter((t) => ['Venue', 'Catering', 'Photography'].includes(t.category)).slice(0, 4).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
              <span className={t.done ? 'text-ink-soft line-through' : ''}>{t.title}</span>
              <span className="shrink-0 text-xs text-ink-soft">{t.done ? 'Done' : isOverdue(t) ? 'Overdue' : fmtDate(t.due, { month: 'short', day: 'numeric' })}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="p-6">
        <Eyebrow>Budget summary</Eyebrow>
        <p className="mt-1 font-serif text-3xl">{money(Math.abs(tot.remaining), ev.currency)}</p>
        <p className={`text-sm ${tot.remaining < 0 ? 'font-medium text-rose' : 'text-ink-soft'}`}>{tot.remaining < 0 ? 'over budget' : 'remaining'} of {money(tot.total, ev.currency)}</p>
        <div className="mt-3"><Progress value={Math.min(100, (tot.spent / tot.total) * 100)} label="Budget used" /></div>
        <p className="mt-3 text-xs text-ink-soft">Paid so far: {money(tot.paid, ev.currency)}</p>
        <Button size="sm" variant="secondary" className="mt-4" onClick={() => setTab('Budget')}>Open budget</Button>
      </Card>
      <Card className="p-6 lg:col-span-2">
        <h3 className="mb-3 text-lg">Important tasks</h3>
        {important.length ? <ul className="divide-y divide-line">{important.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
            <input type="checkbox" aria-label={`Complete ${t.title}`} className="h-4 w-4 accent-[#78566f]" onChange={() => updateTask(t.id, { done: true })} />
            <span className="flex-1">{t.title}</span>
            {isOverdue(t) ? <Badge tone="rose">Overdue</Badge> : <span className="text-xs text-ink-soft">{fmtDate(t.due, { month: 'short', day: 'numeric' })}</span>}
          </li>))}</ul> : <p className="text-sm text-ink-soft">Every task is complete.</p>}
        <button onClick={() => setTab('Timeline')} className="mt-3 text-sm text-plum hover:underline">View full timeline →</button>
      </Card>
      <Card className="bg-blush/50 p-6">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-plum"><Sparkles size={13} /> Recommended for you</p>
        <ul className="mt-3 space-y-3">{recs.map((r) => <li key={r.id}><p className="text-sm font-medium">{r.title}</p><p className="text-xs text-ink-soft">{r.why}</p></li>)}</ul>
        <button onClick={() => go('assistant')} className="mt-4 text-sm text-plum hover:underline">Ask the assistant →</button>
      </Card>
    </div>
  )
}

export function EventPicker() {
  const { events, eventId, setEventId } = useApp()
  return (
    <label className="flex items-center gap-2 text-sm text-ink-soft">Event
      <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="rounded-full border border-line bg-warm px-4 py-2 text-sm font-medium text-ink">
        {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
    </label>
  )
}

export function EventPage({ title, eyebrow, children }: { title: string; eyebrow: string; children: (ev: PlanEvent) => ReactNode }) {
  const { event, events, setWizardOpen } = useApp()
  if (!events.length) return (
    <div className="rounded-2xl border border-dashed border-line p-12 text-center"><h2 className="text-2xl">No events yet</h2><p className="mt-1 text-sm text-ink-soft">Create an event to get started.</p><Button className="mt-4" onClick={() => setWizardOpen(true)}>Create Event</Button></div>
  )
  return (
    <div>
      <SectionTitle eyebrow={eyebrow} title={title} action={<EventPicker />} />
      {children(event)}
    </div>
  )
}

export function AssistantPage() {
  return (
    <EventPage eyebrow="AI Event Assistant" title="Your celebration, thoughtfully planned.">
      {(ev) => <Assistant ev={ev} />}
    </EventPage>
  )
}

export function Workspace() {
  const { event: ev, tab, setTab, progress, go, deleteEvent, setConfirm, toast } = useApp()
  if (!ev) return null
  const d = daysUntil(ev.date)
  return (
    <div>
      <button onClick={() => go('events')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-plum"><ArrowLeft size={15} /> All events</button>
      <header className="relative overflow-hidden rounded-3xl bg-ink">
        <img src={ev.image} alt={`${ev.type} inspiration`} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
        <div className="relative flex flex-col gap-6 px-6 pb-6 pt-24 text-white sm:px-10 sm:pt-32 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex gap-2"><span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-ink">{ev.type}</span>{ev.sample && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">Sample event</span>}</div>
            <h1 className="text-3xl sm:text-5xl">{ev.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
              <span className="flex items-center gap-1.5"><CalendarDays size={15} /> {fmtDate(ev.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}{d >= 0 && ` · ${d} days`}</span>
              <span className="flex items-center gap-1.5"><Users size={15} /> {ev.guests} guests</span>
              <span className="flex items-center gap-1.5"><MapPin size={15} /> {ev.location}</span>
            </div>
          </div>
          <div className="w-full shrink-0 md:w-56">
            <div className="mb-1.5 flex justify-between text-xs"><span>Planning progress</span><span>{progress(ev.id)}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${progress(ev.id)}%` }} /></div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="!bg-white !text-ink hover:!bg-champagne" onClick={() => go('assistant')}><Bot size={14} /> Ask assistant</Button>
              <Button size="sm" variant="ghost" className="!text-white hover:!bg-white/15" aria-label="Delete event" onClick={() => setConfirm({ title: 'Delete this event?', body: `“${ev.name}” and its plan will be removed from this session. This can’t be undone.`, action: 'Delete event', onConfirm: () => { deleteEvent(ev.id); toast('Event deleted') } })}><Trash2 size={14} /></Button>
            </div>
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Event sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="tabpanel" onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${tab === t ? 'border-plum font-medium text-plum-deep' : 'border-transparent text-ink-soft hover:text-ink'}`}>{t}</button>
        ))}
      </div>
      <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${tab}`} key={ev.id + tab} className="rise pt-6">
        {tab === 'Overview' && <OverviewTab ev={ev} />}
        {tab === 'Budget' && <BudgetTab ev={ev} />}
        {tab === 'Timeline' && <TimelineTab ev={ev} />}
        {tab === 'Vendors' && <VendorsTab ev={ev} />}
        {tab === 'Ideas' && <IdeasTab ev={ev} />}
      </div>
    </div>
  )
}
