import { useState } from 'react'
import { AlertTriangle, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES, PAY_STATUSES, money, type Expense, type PayStatus, type PlanEvent } from '../data'
import { budgetRows, budgetTotals } from '../lib'
import { useApp } from '../store'
import { Badge, Button, Card, Empty, Field, Modal, Progress, inputCls } from '../components/ui'

function ExpenseForm({ ev, initial, onClose }: { ev: PlanEvent; initial?: Expense; onClose: () => void }) {
  const { addExpense, updateExpense, toast } = useApp()
  const [f, setF] = useState({ category: initial?.category ?? CATEGORIES[0], description: initial?.description ?? '', amount: initial ? String(initial.amount) : '', status: (initial?.status ?? 'Planned') as PayStatus })
  const [err, setErr] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    if (!f.description.trim()) e.description = 'Describe this expense.'
    if (!f.amount || +f.amount <= 0) e.amount = 'Enter an amount above 0.'
    setErr(e)
    if (Object.keys(e).length) return
    const data = { category: f.category, description: f.description.trim(), amount: +f.amount, status: f.status }
    if (initial) updateExpense(initial.id, data); else addExpense({ ...data, eventId: ev.id })
    toast(initial ? 'Expense updated' : 'Expense added'); onClose()
  }
  return (
    <Modal title={initial ? 'Edit expense' : 'Add expense'} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>{initial ? 'Save changes' : 'Add expense'}</Button></>}>
      <div className="grid gap-4">
        <Field label="Category">{(id) => <select id={id} className={inputCls()} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
        <Field label="Description" error={err.description}>{(id) => <input id={id} className={inputCls(err.description)} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
        <Field label={`Amount (${ev.currency})`} error={err.amount}>{(id) => <input id={id} type="number" min={0} className={inputCls(err.amount)} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />}</Field>
        <Field label="Payment status">{(id) => <select id={id} className={inputCls()} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as PayStatus })}>{PAY_STATUSES.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
      </div>
    </Modal>
  )
}

export function BudgetTab({ ev }: { ev: PlanEvent }) {
  const { expenses, deleteExpense, setConfirm, toast } = useApp()
  const [form, setForm] = useState<{ item?: Expense } | null>(null)
  const rows = budgetRows(ev, expenses)
  const tot = budgetTotals(ev, expenses)
  const list = expenses.filter((x) => x.eventId === ev.id)
  const pct = Math.min(100, Math.round((tot.spent / ev.budget) * 100))
  const overCats = rows.filter((r) => r.over)
  const cur = ev.currency

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Total budget', money(tot.total, cur)], ['Planned & actual spend', money(tot.spent, cur)], [tot.remaining < 0 ? 'Over budget by' : 'Remaining', money(Math.abs(tot.remaining), cur)]].map(([k, v], i) => (
          <Card key={k} className={`p-5 ${i === 2 && tot.remaining < 0 ? '!border-rose/50 !bg-rose-tint' : ''}`}>
            <p className="text-sm text-ink-soft">{k}</p><p className="mt-1 font-serif text-3xl">{v}</p>
            {i === 1 && <div className="mt-3"><Progress value={pct} label="Budget used" /></div>}
          </Card>
        ))}
      </div>
      {overCats.length > 0 && (
        <div role="status" className="flex items-start gap-3 rounded-xl bg-rose-tint p-4 text-sm text-rose">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p><strong>{overCats.map((c) => c.category).join(', ')}</strong> {overCats.length > 1 ? 'are' : 'is'} over the suggested category allocation. Totals still add up to {money(tot.spent, cur)}.</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card className="p-5">
          <h3 className="text-xl">Planned vs actual</h3>
          <p className="mb-3 text-xs text-ink-soft">Planned amounts are a suggested split of your total budget (AI estimate). Actuals come from your expenses.</p>
          <div className="h-72" role="img" aria-label="Bar chart of planned versus actual spending by category">
            <ResponsiveContainer>
              <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }} barGap={2}>
                <CartesianGrid horizontal={false} stroke="#e7e1d6" />
                <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 12, fill: '#5e5b50' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" width={96} tick={{ fontSize: 12, fill: '#292821' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => money(Number(v), cur)} cursor={{ fill: '#f6f2ea' }} />
                <Bar dataKey="planned" name="Planned" fill="#d9cfbd" radius={3} barSize={9} />
                <Bar dataKey="actual" name="Actual" radius={3} barSize={9}>{rows.map((r) => <Cell key={r.category} fill={r.over ? '#a64b4b' : '#78566f'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#d9cfbd]" /> Planned</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-plum" /> Actual</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-rose" /> Over allocation</span>
          </div>
        </Card>

        <Card className="overflow-x-auto p-5">
          <h3 className="mb-3 text-xl">By category</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-ink-soft"><th className="pb-2 font-medium">Category</th><th className="pb-2 text-right font-medium">Planned</th><th className="pb-2 text-right font-medium">Actual</th><th className="pb-2 text-right font-medium">Left</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.category} className={r.over ? 'bg-rose-tint/60' : ''}>
                  <td className="py-2.5 pl-1">{r.category} {r.over && <Badge tone="rose"><AlertTriangle size={11} /> Over</Badge>}</td>
                  <td className="py-2.5 text-right tabular-nums">{money(r.planned, cur)}</td>
                  <td className="py-2.5 text-right tabular-nums">{money(r.actual, cur)}</td>
                  <td className={`py-2.5 pr-1 text-right tabular-nums ${r.over ? 'font-medium text-rose' : ''}`}>{r.remaining < 0 ? '−' : ''}{money(Math.abs(r.remaining), cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl">Expenses</h3>
          <Button size="sm" onClick={() => setForm({})}><Plus size={14} /> Add expense</Button>
        </div>
        {list.length === 0 ? (
          <Empty icon={<Receipt size={20} />} title="No expenses yet" body="Add your first expense to start tracking spend against your budget." action={<Button size="sm" onClick={() => setForm({})}>Add expense</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <div className="min-w-[160px] flex-1"><p className="text-sm font-medium">{x.description}</p><p className="text-xs text-ink-soft">{x.category}</p></div>
                <Badge tone={x.status === 'Paid' ? 'sage' : x.status === 'Deposit paid' ? 'plum' : 'neutral'}>{x.status}</Badge>
                <p className="w-24 text-right text-sm font-medium tabular-nums">{money(x.amount, cur)}</p>
                <div className="flex gap-1">
                  <button aria-label={`Edit ${x.description}`} onClick={() => setForm({ item: x })} className="rounded-full p-2 text-ink-soft hover:bg-champagne"><Pencil size={15} /></button>
                  <button aria-label={`Delete ${x.description}`} onClick={() => setConfirm({ title: 'Delete expense?', body: `“${x.description}” will be removed and your totals will update.`, action: 'Delete', onConfirm: () => { deleteExpense(x.id); toast('Expense deleted') } })} className="rounded-full p-2 text-ink-soft hover:bg-rose-tint hover:text-rose"><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {form && <ExpenseForm ev={ev} initial={form.item} onClose={() => setForm(null)} />}
    </div>
  )
}
