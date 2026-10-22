import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CATEGORIES, DEFAULT_IMG, TODAY, categoryShare, seedEvents, seedExpenses, seedIdeas, seedTasks, seedVendors,
  type Expense, type Idea, type PlanEvent, type Task, type Vendor,
} from './data'

export type View = 'overview' | 'events' | 'budget' | 'timeline' | 'vendors' | 'assistant' | 'settings' | 'workspace'
export type Tab = 'Overview' | 'Budget' | 'Timeline' | 'Vendors' | 'Ideas'
interface Toast { id: number; msg: string }
interface Confirm { title: string; body: string; action: string; onConfirm: () => void }

const uid = () => Math.random().toString(36).slice(2, 9)

const STORAGE_KEY = 'planora_app_data_v1'

interface StoredData {
  events: PlanEvent[]
  tasks: Task[]
  expenses: Expense[]
  vendors: Vendor[]
  ideas: Idea[]
  profile: { name: string; email: string }
}

function loadInitialData(): StoredData {
  if (typeof window === 'undefined') {
    return { events: seedEvents, tasks: seedTasks, expenses: seedExpenses, vendors: seedVendors, ideas: seedIdeas, profile: { name: 'Priya Raman', email: 'priya@example.com' } }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { events: seedEvents, tasks: seedTasks, expenses: seedExpenses, vendors: seedVendors, ideas: seedIdeas, profile: { name: 'Priya Raman', email: 'priya@example.com' } }
    }
    const data = JSON.parse(raw)
    const validEvents = Array.isArray(data.events) && data.events.length > 0
      ? data.events.filter((e: any) => e && typeof e.id === 'string' && typeof e.name === 'string')
      : seedEvents
    const validTasks = Array.isArray(data.tasks)
      ? data.tasks.filter((t: any) => t && typeof t.id === 'string' && typeof t.title === 'string')
      : seedTasks
    const validExpenses = Array.isArray(data.expenses)
      ? data.expenses.filter((x: any) => x && typeof x.id === 'string' && typeof x.amount === 'number')
      : seedExpenses
    const validVendors = Array.isArray(data.vendors)
      ? data.vendors.filter((v: any) => v && typeof v.id === 'string' && typeof v.name === 'string')
      : seedVendors
    const validIdeas = Array.isArray(data.ideas)
      ? data.ideas.filter((i: any) => i && typeof i.id === 'string' && typeof i.title === 'string')
      : seedIdeas
    const validProfile = data.profile && typeof data.profile.name === 'string' && typeof data.profile.email === 'string'
      ? data.profile
      : { name: 'Priya Raman', email: 'priya@example.com' }

    return {
      events: validEvents,
      tasks: validTasks,
      expenses: validExpenses,
      vendors: validVendors,
      ideas: validIdeas,
      profile: validProfile,
    }
  } catch {
    return { events: seedEvents, tasks: seedTasks, expenses: seedExpenses, vendors: seedVendors, ideas: seedIdeas, profile: { name: 'Priya Raman', email: 'priya@example.com' } }
  }
}

function useStore() {
  const initial = useMemo(() => loadInitialData(), [])

  const [events, setEvents] = useState<PlanEvent[]>(initial.events)
  const [tasks, setTasks] = useState<Task[]>(initial.tasks)
  const [expenses, setExpenses] = useState<Expense[]>(initial.expenses)
  const [vendors, setVendors] = useState<Vendor[]>(initial.vendors)
  const [ideas, setIdeas] = useState<Idea[]>(initial.ideas)
  const [profile, setProfile] = useState<{ name: string; email: string }>(initial.profile)

  const [view, setView] = useState<View>('overview')
  const [tab, setTab] = useState<Tab>('Overview')
  const [eventId, setEventId] = useState(() => initial.events[0]?.id || 'e1')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [simulateError, setSimulateError] = useState(false)
  const counter = useRef(0)

  // Persist application data to localStorage safely whenever core collections change
  useEffect(() => {
    try {
      const dataToStore: StoredData = { events, tasks, expenses, vendors, ideas, profile }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore))
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }, [events, tasks, expenses, vendors, ideas, profile])

  const toast = useCallback((msg: string) => {
    const id = ++counter.current
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  const go = (v: View) => { setView(v); setMenuOpen(false); window.scrollTo({ top: 0 }) }
  const openEvent = (id: string, t: Tab = 'Overview') => { setEventId(id); setTab(t); setView('workspace'); setMenuOpen(false); window.scrollTo({ top: 0 }) }

  const progress = (id: string) => {
    const ts = tasks.filter((x) => x.eventId === id)
    return ts.length ? Math.round((ts.filter((x) => x.done).length / ts.length) * 100) : 0
  }

  const createEvent = (e: Omit<PlanEvent, 'id' | 'image' | 'sample'>) => {
    const id = 'u' + uid()
    setEvents((p) => [{ ...e, id, image: DEFAULT_IMG[e.type], sample: false }, ...p])
    const d = new Date(e.date + 'T12:00:00')
    const before = (days: number) => {
      const x = new Date(d); x.setDate(x.getDate() - days)
      const iso = x.toISOString().slice(0, 10)
      return iso < TODAY ? TODAY : iso
    }
    const plan: [string, number, string][] = [
      ['Confirm and pay venue deposit', 90, 'Venue'], ['Draft guest list', 80, 'Miscellaneous'],
      ['Shortlist caterers and request quotes', 70, 'Catering'], ['Book photographer', 60, 'Photography'],
      ['Send invitations', 45, 'Miscellaneous'], ['Confirm decor and florals', 30, 'Decorations'],
      ['Plan entertainment and run-of-show', 21, 'Entertainment'], ['Final headcount to caterer', 7, 'Catering'],
    ]
    setTasks((p) => [...p, ...plan.map(([title, days, category]) => ({ id: 't' + uid(), eventId: id, title, due: before(days), category, done: false }))])
    setExpenses((p) => [...p, ...CATEGORIES.map((c) => ({
      id: 'x' + uid(), eventId: id, category: c, description: `Estimated ${c.toLowerCase()} (AI estimate)`,
      amount: Math.round((e.budget * categoryShare[c] * 0.9) / 50) * 50, status: 'Planned' as const,
    }))])
    const th = e.theme || 'Signature celebration'
    setIdeas((p) => [...p,
      { id: 'i' + uid(), eventId: id, kind: 'Theme', title: th, why: `Built from the style you chose${e.palette ? ` and your ${e.palette} palette` : ''}.`, saved: false },
      { id: 'i' + uid(), eventId: id, kind: 'Menu', title: 'Shared-table menu', why: `Suits ${e.guests} guests${e.food ? ` and your preference: ${e.food}` : ''}.`, saved: false },
      { id: 'i' + uid(), eventId: id, kind: 'Guest activity', title: 'Memory wall', why: 'Inexpensive, works for any age group and leaves a keepsake.', saved: false },
    ])
    setEventId(id); setTab('Overview'); setView('workspace')
    return id
  }

  const resetToSampleData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setEvents(seedEvents)
    setTasks(seedTasks)
    setExpenses(seedExpenses)
    setVendors(seedVendors)
    setIdeas(seedIdeas)
    setProfile({ name: 'Priya Raman', email: 'priya@example.com' })
    setEventId('e1')
    setTab('Overview')
    toast('Application reset to sample demo data')
  }

  const upd = <T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>) => (id: string, patch: Partial<T>) =>
    set((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  return {
    events, tasks, expenses, vendors, ideas, view, tab, eventId, wizardOpen, menuOpen, toasts, confirm, simulateError, profile,
    setTab, setWizardOpen, setMenuOpen, setConfirm, setSimulateError, setProfile, setEventId, toast, go, openEvent, progress, createEvent, resetToSampleData,
    event: events.find((e) => e.id === eventId) ?? events[0],
    updateEvent: upd<PlanEvent>(setEvents),
    deleteEvent: (id: string) => { setEvents((p) => p.filter((e) => e.id !== id)); setView('events'); setEventId(events.find((e) => e.id !== id)?.id ?? '') },
    addTask: (t: Omit<Task, 'id'>) => setTasks((p) => [...p, { ...t, id: 't' + uid() }]),
    updateTask: upd<Task>(setTasks),
    deleteTask: (id: string) => setTasks((p) => p.filter((x) => x.id !== id)),
    addExpense: (x: Omit<Expense, 'id'>) => setExpenses((p) => [...p, { ...x, id: 'x' + uid() }]),
    updateExpense: upd<Expense>(setExpenses),
    deleteExpense: (id: string) => setExpenses((p) => p.filter((x) => x.id !== id)),
    addVendor: (x: Omit<Vendor, 'id' | 'sample'>) => setVendors((p) => [...p, { ...x, id: 'v' + uid(), sample: false }]),
    updateVendor: upd<Vendor>(setVendors),
    deleteVendor: (id: string) => setVendors((p) => p.filter((x) => x.id !== id)),
    addIdea: (x: Omit<Idea, 'id'>) => setIdeas((p) => [...p, { ...x, id: 'i' + uid() }]),
    updateIdea: upd<Idea>(setIdeas),
  }
}

type Store = ReturnType<typeof useStore>
const Ctx = createContext<Store | null>(null)
export function StoreProvider({ children }: { children: ReactNode }) {
  const s = useStore()
  const v = useMemo(() => s, [s])
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
export const useApp = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}
