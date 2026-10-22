import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }
export function Button({ variant = 'primary', size = 'md', className = '', ...p }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
  const sizes = { sm: 'px-3.5 py-1.5 text-[13px]', md: 'px-5 py-2.5 text-sm' }
  const v = {
    primary: 'bg-plum text-white hover:bg-plum-deep',
    secondary: 'border border-line bg-warm text-ink hover:border-plum hover:text-plum-deep',
    ghost: 'text-ink-soft hover:bg-champagne/60 hover:text-ink',
    danger: 'bg-rose text-white hover:bg-[#8a3a3a]',
  }[variant]
  return <button type="button" className={`${base} ${sizes[size]} ${v} ${className}`} {...p} />
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-warm ${className}`}>{children}</div>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum">{children}</p>
}

export function SectionTitle({ title, action, eyebrow }: { title: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="text-2xl text-ink">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progress'} className="h-1.5 w-full overflow-hidden rounded-full bg-champagne">
      <div className="h-full rounded-full bg-plum transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'plum' | 'sage' | 'rose' | 'sample'; children: ReactNode }) {
  const t = {
    neutral: 'bg-champagne text-ink-soft',
    plum: 'bg-plum-tint text-plum-deep',
    sage: 'bg-sage-tint text-sage-deep',
    rose: 'bg-rose-tint text-rose',
    sample: 'border border-dashed border-ink-soft/40 text-ink-soft',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${t}`}>{children}</span>
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
      {children(id)}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-rose">{error}</p>}
    </div>
  )
}
export const inputCls = (err?: string) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 transition focus:border-plum focus:outline-none focus:ring-2 focus:ring-plum/25 ${err ? 'border-rose' : 'border-line'}`

export function Modal({ title, onClose, children, wide, footer }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; prev?.focus() }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`rise flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-ivory shadow-2xl outline-none sm:rounded-3xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-xl">{title}</h2>
          <button aria-label="Close dialog" onClick={onClose} className="rounded-full p-2 text-ink-soft hover:bg-champagne"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-between gap-3 border-t border-line bg-warm px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-plum-tint text-plum">{icon}</div>
      <h3 className="text-lg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
