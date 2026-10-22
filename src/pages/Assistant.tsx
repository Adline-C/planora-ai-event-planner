import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bot, CalendarPlus, Loader2, PiggyBank, Bookmark, Send, Sparkles, Info } from 'lucide-react'
import { TODAY, daysUntil, fmtDate, money, type PlanEvent } from '../data'
import { budgetTotals } from '../lib'
import { useApp } from '../store'
import { Button, Card, Eyebrow, inputCls } from '../components/ui'

type Action = { kind: 'timeline'; label: string; tasks: { title: string; due: string; category: string }[] } | { kind: 'idea'; label: string; ideaKind: string; title: string; why: string } | { kind: 'budget'; label: string; category: string; description: string; amount: number }
interface Answer { intro: string; suggestions: { title: string; detail: string }[]; actions: Action[]; unsupported?: boolean }
interface Turn { id: number; q: string; state: 'loading' | 'done' | 'error'; errorMsg?: string; a?: Answer }

const PROMPTS = ['Suggest a theme within my budget', 'Help me reduce costs', 'Create a preparation timeline', 'Suggest ideas for my guests', 'What am I forgetting?']

export function Assistant({ ev }: { ev: PlanEvent }) {
  const { addTask, addIdea, addExpense, expenses, toast, simulateError } = useApp()
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => setTurns([]), [ev.id])
  useEffect(() => { if (turns.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [turns])
  const tot = budgetTotals(ev, expenses)

  const ask = async (q: string) => {
    if (!q.trim()) return
    const id = Date.now() + Math.random()
    setTurns((t) => [...t, { id, q, state: 'loading' }])
    setText('')

    if (simulateError) {
      setTimeout(() => {
        setTurns((t) => t.map((x) => x.id !== id ? x : { ...x, state: 'error', errorMsg: 'Simulation mode active: Simulated generation error.' }))
      }, 600)
      return
    }

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          event: {
            id: ev.id,
            name: ev.name,
            type: ev.type,
            date: ev.date,
            location: ev.location,
            guests: ev.guests,
            budget: ev.budget,
            currency: ev.currency,
            theme: ev.theme,
            palette: ev.palette,
            food: ev.food,
            needs: ev.needs,
          }
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        const msg = errorData?.error || `Server responded with status ${res.status}`
        setTurns((t) => t.map((x) => x.id !== id ? x : { ...x, state: 'error', errorMsg: msg }))
        return
      }

      const answer: Answer = await res.json()
      setTurns((t) => t.map((x) => x.id !== id ? x : { ...x, state: 'done', a: answer }))
    } catch (err: any) {
      setTurns((t) => t.map((x) => x.id !== id ? x : { ...x, state: 'error', errorMsg: err?.message || 'Network error communicating with the assistant.' }))
    }
  }
  const run = (a: Action) => {
    if (a.kind === 'timeline') { a.tasks.forEach((t) => addTask({ ...t, eventId: ev.id, done: false })); toast(`${a.tasks.length} tasks added to timeline`) }
    if (a.kind === 'idea') { addIdea({ eventId: ev.id, kind: a.ideaKind, title: a.title, why: a.why, saved: true }); toast('Idea saved to your event plan') }
    if (a.kind === 'budget') { addExpense({ eventId: ev.id, category: a.category, description: a.description, amount: a.amount, status: 'Planned' }); toast(`${money(a.amount, ev.currency)} added to budget as Planned`) }
  }
  const icon = { timeline: CalendarPlus, idea: Bookmark, budget: PiggyBank }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit p-5">
        <Eyebrow>Confirmed from your plan</Eyebrow>
        <h3 className="mt-1 text-lg">{ev.name}</h3>
        <dl className="mt-3 space-y-1.5 text-sm">
          {[['Type', ev.type], ['Date', fmtDate(ev.date)], ['Location', ev.location], ['Guests', String(ev.guests)], ['Budget', money(ev.budget, ev.currency)], ['Logged spend', money(tot.spent, ev.currency)], ['Theme', ev.theme || '—']].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3"><dt className="text-ink-soft">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-4 flex gap-2 rounded-lg bg-champagne/60 p-3 text-xs text-ink-soft"><Info size={14} className="mt-0.5 shrink-0" /> Planora is powered by Google Gemini via a secure server endpoint. Suggestions, timelines, and budget items can be added directly to your plan.</p>
      </Card>

      <div className="flex min-h-[520px] flex-col rounded-2xl border border-line bg-warm">
        <div className="flex-1 space-y-6 p-5">
          {turns.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-plum-tint text-plum"><Sparkles size={22} /></span>
              <h3 className="mt-3 text-xl">Ask about {ev.name}</h3>
              <p className="mt-1 max-w-sm text-sm text-ink-soft">Pick a prompt or type your own. Answers use this event’s date, budget, guest count and preferences.</p>
            </div>
          )}
          {turns.map((t) => (
            <div key={t.id} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-plum px-4 py-2.5 text-sm text-white">{t.q}</p>
              {t.state === 'loading' && <p role="status" className="flex items-center gap-2 text-sm text-ink-soft"><Loader2 size={16} className="animate-spin" /> Thinking through your plan…</p>}
              {t.state === 'error' && (
                <div role="alert" className="flex items-start gap-3 rounded-xl bg-rose-tint p-4 text-sm text-rose">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">The assistant couldn’t respond.</p>
                    {t.errorMsg && <p className="mt-0.5 text-xs opacity-90">{t.errorMsg}</p>}
                    <button className="mt-1 block underline" onClick={() => { setTurns((x) => x.filter((y) => y.id !== t.id)); ask(t.q) }}>Try again</button>
                  </div>
                </div>
              )}
              {t.state === 'done' && t.a && (t.a.unsupported ? (
                <div className="rounded-xl border border-dashed border-line p-4 text-sm"><p className="font-medium">I can’t help with that one yet.</p><p className="mt-1 text-ink-soft">I can help with themes, budgets, timelines, guest ideas and checklists for this event. Try a suggestion below.</p></div>
              ) : (
                <div className="rise rounded-2xl border border-line bg-ivory p-5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-plum"><Bot size={13} /> AI-generated · estimates and suggestions</p>
                  <p className="mt-2 text-sm">{t.a.intro}</p>
                  <ul className="mt-3 space-y-2">{t.a.suggestions.map((s) => <li key={s.title} className="rounded-xl bg-warm p-3 text-sm"><p className="font-medium">{s.title}</p><p className="text-ink-soft">{s.detail}</p></li>)}</ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.a.actions.map((a) => { const I = icon[a.kind]; return <Button key={a.label} size="sm" variant="secondary" onClick={() => run(a)}><I size={14} /> {a.label}</Button> })}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="border-t border-line p-4">
          <div className="mb-3 flex flex-wrap gap-2">{PROMPTS.map((p) => <button key={p} onClick={() => ask(p)} className="rounded-full border border-line bg-ivory px-3 py-1.5 text-xs transition hover:border-plum hover:text-plum-deep">{p}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); ask(text) }} className="flex gap-2">
            <label className="sr-only" htmlFor="ask">Ask the assistant</label>
            <input id="ask" className={inputCls()} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about this event…" />
            <Button type="submit" aria-label="Send" disabled={!text.trim()}><Send size={16} /></Button>
          </form>
        </div>
      </div>
    </div>
  )
}
