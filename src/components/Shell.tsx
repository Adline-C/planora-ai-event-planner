import { useEffect, useRef, type ReactNode } from 'react'
import { Bot, CalendarHeart, CheckCircle2, Handshake, LayoutDashboard, ListChecks, Menu, PiggyBank, Plus, Settings, X, Flower2 } from 'lucide-react'
import { useApp, type View } from '../store'
import { Button, Modal } from './ui'

const NAV: { id: View; label: string; icon: typeof Settings }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'events', label: 'My Events', icon: CalendarHeart },
  { id: 'budget', label: 'Budget Planner', icon: PiggyBank },
  { id: 'timeline', label: 'Timeline & Tasks', icon: ListChecks },
  { id: 'vendors', label: 'Vendors', icon: Handshake },
  { id: 'assistant', label: 'AI Event Assistant', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-plum text-white"><Flower2 size={18} strokeWidth={1.6} /></span>
      <span className="font-serif text-[22px] tracking-tight text-ink">Planora</span>
    </div>
  )
}

function SidebarBody() {
  const { view, go, setWizardOpen, profile, setMenuOpen } = useApp()
  const active = view === 'workspace' ? 'events' : view
  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="px-2"><Logo /></div>
      <Button className="mt-7 w-full" onClick={() => { setWizardOpen(true); setMenuOpen(false) }}><Plus size={16} /> Create Event</Button>
      <nav aria-label="Primary" className="mt-6 flex flex-col gap-0.5">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => go(n.id)} aria-current={active === n.id ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active === n.id ? 'bg-plum-tint font-medium text-plum-deep' : 'text-ink-soft hover:bg-champagne/60 hover:text-ink'}`}>
            <n.icon size={18} strokeWidth={1.7} /> {n.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-xl border border-line bg-warm p-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-sm font-semibold text-white" aria-hidden>{profile.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{profile.name}</p>
          <p className="truncate text-xs text-ink-soft">Demo workspace</p>
        </div>
      </div>
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { menuOpen, setMenuOpen, setWizardOpen, toasts, confirm, setConfirm } = useApp()
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', k)
    menuRef.current?.focus()
    return () => document.removeEventListener('keydown', k)
  }, [menuOpen, setMenuOpen])
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-[#f6f2ea] lg:block"><SidebarBody /></aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ivory/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setWizardOpen(true)} aria-label="Create event"><Plus size={14} /> Create</Button>
          <button aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="rounded-full p-2 hover:bg-champagne"><Menu size={22} /></button>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <div ref={menuRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Navigation" className="rise absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#f6f2ea] outline-none">
            <button aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 rounded-full p-2 hover:bg-champagne"><X size={18} /></button>
            <SidebarBody />
          </div>
        </div>
      )}
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl">{children}</div></main>

      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rise pointer-events-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg">
            <CheckCircle2 size={16} className="text-sage" /> {t.msg}
          </div>
        ))}
      </div>
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}
          footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => { confirm.onConfirm(); setConfirm(null) }}>{confirm.action}</Button></>}>
          <p className="text-sm text-ink-soft">{confirm.body}</p>
        </Modal>
      )}
    </div>
  )
}
