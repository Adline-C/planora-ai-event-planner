import { useState } from 'react'
import { AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react'
import { CURRENCIES, EVENT_TYPES, TODAY, fmtDate, money, type EventType } from '../data'
import { useApp } from '../store'
import { Button, Field, Modal, inputCls } from './ui'

const THEMES = ['Garden romance', 'Modern minimal', 'Rustic harvest', 'Black-tie classic', 'Boho festival', 'Candlelit intimate']
const PALETTES = [
  { n: 'Ivory & sage', c: ['#FAF8F4', '#879780'] },
  { n: 'Plum & blush', c: ['#78566F', '#F5E4E1'] },
  { n: 'Terracotta & wheat', c: ['#B8674A', '#E5D3A8'] },
  { n: 'Navy & gold', c: ['#27324A', '#C6A664'] },
]
const STEPS = ['Details', 'Preferences', 'Generate']

export function Wizard() {
  const { setWizardOpen, createEvent, toast, simulateError } = useApp()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState(false)
  const [f, setF] = useState({
    name: '', type: 'Wedding' as EventType, date: '', location: '', guests: '',
    budget: '', currency: 'USD', theme: '', palette: '', food: '', needs: '',
  })
  const set = (k: keyof typeof f, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })) }

  const validate = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!f.name.trim()) e.name = 'Give your event a name.'
      if (!f.date) e.date = 'Choose the event date.'
      else if (f.date < TODAY) e.date = 'Pick a date in the future.'
      if (!f.location.trim()) e.location = 'Add a city or venue.'
      if (!f.guests || +f.guests < 1) e.guests = 'Enter at least 1 guest.'
    }
    if (s === 1) {
      if (!f.budget || +f.budget < 100) e.budget = 'Enter a budget of at least 100.'
      if (!f.theme.trim()) e.theme = 'Choose or describe a style.'
    }
    setErrors(e)
    return !Object.keys(e).length
  }
  const next = () => validate(step) && setStep(step + 1)
  const generate = () => {
    if (!validate(0)) return setStep(0)
    if (!validate(1)) return setStep(1)
    setBusy(true); setFail(false)
    setTimeout(() => {
      setBusy(false)
      if (simulateError) return setFail(true)
      createEvent({ name: f.name.trim(), type: f.type, date: f.date, location: f.location.trim(), guests: +f.guests, budget: +f.budget, currency: f.currency, theme: f.theme, palette: f.palette, food: f.food, needs: f.needs })
      setWizardOpen(false)
      toast('Starter plan created. Review the AI estimates before relying on them.')
    }, 1800)
  }

  const summary: [string, string, number][] = [
    ['Event', `${f.name || '—'} · ${f.type}`, 0], ['Date', f.date ? fmtDate(f.date) : '—', 0], ['Location', f.location || '—', 0],
    ['Guests', f.guests || '—', 0], ['Budget', f.budget ? money(+f.budget, f.currency) : '—', 1], ['Style', f.theme || '—', 1],
    ['Palette', f.palette || 'Not set', 1], ['Food', f.food || 'Not set', 1], ['Requirements', f.needs || 'None noted', 1],
  ]

  return (
    <Modal title="Create a new event" wide onClose={() => !busy && setWizardOpen(false)}
      footer={
        <>
          <Button variant="ghost" disabled={busy} onClick={() => (step ? setStep(step - 1) : setWizardOpen(false))}>{step ? 'Back' : 'Cancel'}</Button>
          {step < 2 ? <Button onClick={next}>Continue</Button> : (
            <Button onClick={generate} disabled={busy}>{busy ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> {fail ? 'Try again' : 'Generate My Event Plan'}</>}</Button>
          )}
        </>
      }>
      <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${i < step ? 'bg-sage text-white' : i === step ? 'bg-plum text-white' : 'bg-champagne text-ink-soft'}`}>{i < step ? <Check size={14} /> : i + 1}</span>
            <span className={`text-sm ${i === step ? 'font-medium' : 'text-ink-soft'}`}>{s}</span>
            {i < 2 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Event name" error={errors.name}>{(id) => <input id={id} className={inputCls(errors.name)} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Nina & Omar’s Wedding" />}</Field></div>
          <Field label="Event type">{(id) => <select id={id} className={inputCls()} value={f.type} onChange={(e) => set('type', e.target.value)}>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>}</Field>
          <Field label="Event date" error={errors.date}>{(id) => <input id={id} type="date" min={TODAY} className={inputCls(errors.date)} value={f.date} onChange={(e) => set('date', e.target.value)} />}</Field>
          <Field label="Location" error={errors.location}>{(id) => <input id={id} className={inputCls(errors.location)} value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="City or venue" />}</Field>
          <Field label="Expected guest count" error={errors.guests}>{(id) => <input id={id} type="number" min={1} className={inputCls(errors.guests)} value={f.guests} onChange={(e) => set('guests', e.target.value)} placeholder="80" />}</Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Overall budget" error={errors.budget}>{(id) => <input id={id} type="number" min={0} className={inputCls(errors.budget)} value={f.budget} onChange={(e) => set('budget', e.target.value)} placeholder="20000" />}</Field>
          <Field label="Currency">{(id) => <select id={id} className={inputCls()} value={f.currency} onChange={(e) => set('currency', e.target.value)}>{CURRENCIES.map((t) => <option key={t}>{t}</option>)}</select>}</Field>
          <div className="sm:col-span-2">
            <Field label="Preferred style or theme" error={errors.theme}>{(id) => (
              <>
                <input id={id} className={inputCls(errors.theme)} value={f.theme} onChange={(e) => set('theme', e.target.value)} placeholder="Type your own or pick below" />
                <div className="mt-2 flex flex-wrap gap-2">{THEMES.map((t) => <button key={t} type="button" aria-pressed={f.theme === t} onClick={() => set('theme', t)} className={`rounded-full border px-3 py-1 text-xs transition ${f.theme === t ? 'border-plum bg-plum-tint font-medium text-plum-deep' : 'border-line hover:border-plum'}`}>{t}</button>)}</div>
              </>
            )}</Field>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-[13px] font-medium">Colour palette</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Colour palette">
              {PALETTES.map((p) => (
                <button key={p.n} type="button" aria-pressed={f.palette === p.n} onClick={() => set('palette', p.n)} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition ${f.palette === p.n ? 'border-plum bg-plum-tint font-medium' : 'border-line hover:border-plum'}`}>
                  <span className="flex -space-x-1.5">{p.c.map((c) => <span key={c} className="h-5 w-5 rounded-full border border-white" style={{ background: c }} />)}</span>{p.n}
                </button>
              ))}
            </div>
          </div>
          <Field label="Food preferences">{(id) => <input id={id} className={inputCls()} value={f.food} onChange={(e) => set('food', e.target.value)} placeholder="e.g. vegetarian, halal, buffet" />}</Field>
          <Field label="Special requirements or accessibility needs">{(id) => <input id={id} className={inputCls()} value={f.needs} onChange={(e) => set('needs', e.target.value)} placeholder="e.g. step-free access, allergies" />}</Field>
        </div>
      )}

      {step === 2 && (
        <div>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-warm">
            {summary.map(([k, v, s]) => (
              <div key={k} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="flex items-center gap-3 text-right font-medium">{v}
                  <button type="button" onClick={() => setStep(s)} className="text-xs font-normal text-plum underline underline-offset-2">Edit</button></dd>
              </div>
            ))}
          </dl>
          {fail && (
            <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl bg-rose-tint p-4 text-sm text-rose">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div><p className="font-medium">We couldn’t generate your plan.</p><p>Your answers are saved. Check your connection and try again.</p></div>
            </div>
          )}
          <p className="mt-4 text-xs text-ink-soft">This prototype generates a starter checklist, budget split and ideas from simple local rules. No AI service is connected yet, and all figures are estimates for you to edit.</p>
        </div>
      )}
    </Modal>
  )
}
