import { useState } from 'react'
import { AlertCircle, Check, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { CATEGORIES, fmtDate, type PlanEvent, type Task } from '../data'
import { isOverdue } from '../lib'
import { useApp } from '../store'
import { Badge, Button, Card, Empty, Field, Modal, inputCls } from '../components/ui'

export function TaskForm({ ev, initial, defaults, onClose }: { ev: PlanEvent; initial?: Task; defaults?: Partial<Task>; onClose: () => void }) {
  const { addTask, updateTask, toast } = useApp()
  const [f, setF] = useState({ title: initial?.title ?? defaults?.title ?? '', due: initial?.due ?? defaults?.due ?? '', category: initial?.category ?? defaults?.category ?? CATEGORIES[0] })
  const [err, setErr] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'Enter a task title.'
    if (!f.due) e.due = 'Choose a due date.'
    setErr(e)
    if (Object.keys(e).length) return
    if (initial) updateTask(initial.id, { ...f, title: f.title.trim() }); else addTask({ ...f, title: f.title.trim(), eventId: ev.id, done: false })
    toast(initial ? 'Task updated' : 'Task added to timeline'); onClose()
  }
  return (
    <Modal title={initial ? 'Edit task' : 'Add task'} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>{initial ? 'Save changes' : 'Add task'}</Button></>}>
      <div className="grid gap-4">
        <Field label="Task title" error={err.title}>{(id) => <input id={id} className={inputCls(err.title)} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due date" error={err.due}>{(id) => <input id={id} type="date" className={inputCls(err.due)} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />}</Field>
          <Field label="Category">{(id) => <select id={id} className={inputCls()} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
        </div>
      </div>
    </Modal>
  )
}

export function TimelineTab({ ev }: { ev: PlanEvent }) {
  const { tasks, updateTask, deleteTask, setConfirm, toast } = useApp()
  const [form, setForm] = useState<{ item?: Task } | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const all = tasks.filter((t) => t.eventId === ev.id).sort((a, b) => a.due.localeCompare(b.due))
  const list = all.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done))
  const done = all.filter((t) => t.done).length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft"><strong className="text-ink">{done}</strong> of {all.length} tasks complete · event on {fmtDate(ev.date)}</p>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Filter tasks" className="flex rounded-full border border-line bg-warm p-0.5 text-xs">
            {(['all', 'open', 'done'] as const).map((k) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 capitalize ${filter === k ? 'bg-plum text-white' : 'text-ink-soft'}`}>{k}</button>)}
          </div>
          <Button size="sm" onClick={() => setForm({})}><Plus size={14} /> Add task</Button>
        </div>
      </div>
      {list.length === 0 ? (
        <Empty icon={<ListChecks size={20} />} title="Nothing here" body="No tasks match this filter. Add a task to build your timeline." action={<Button size="sm" onClick={() => setForm({})}>Add task</Button>} />
      ) : (
        <ol className="relative ml-3 border-l border-line">
          {list.map((t) => {
            const od = isOverdue(t)
            return (
              <li key={t.id} className="relative pb-3 pl-7">
                <button role="checkbox" aria-checked={t.done} aria-label={`${t.title}: ${t.done ? 'completed' : 'not completed'}`}
                  onClick={() => { updateTask(t.id, { done: !t.done }); toast(t.done ? 'Marked as open' : 'Task completed') }}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      updateTask(t.id, { done: !t.done })
                      toast(t.done ? 'Marked as open' : 'Task completed')
                    }
                  }}
                  className={`absolute -left-3 top-4 grid h-6 w-6 place-items-center rounded-full border-2 bg-ivory transition ${t.done ? 'border-sage bg-sage text-white' : od ? 'border-rose' : 'border-plum/50 hover:border-plum'}`}>
                  {t.done && <Check size={13} strokeWidth={3} />}
                </button>
                <Card className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 ${od ? '!border-rose/40' : ''}`}>
                  <div className="min-w-[180px] flex-1">
                    <p className={`text-sm font-medium ${t.done ? 'text-ink-soft line-through' : ''}`}>{t.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{fmtDate(t.due)} · {t.category}</p>
                  </div>
                  {t.done ? <Badge tone="sage"><Check size={11} /> Done</Badge> : od ? <Badge tone="rose"><AlertCircle size={11} /> Overdue</Badge> : <Badge>Upcoming</Badge>}
                  <div className="flex gap-1">
                    <button aria-label={`Edit ${t.title}`} onClick={() => setForm({ item: t })} className="rounded-full p-2 text-ink-soft hover:bg-champagne"><Pencil size={15} /></button>
                    <button aria-label={`Delete ${t.title}`} onClick={() => setConfirm({ title: 'Delete task?', body: `“${t.title}” will be removed from your timeline.`, action: 'Delete', onConfirm: () => { deleteTask(t.id); toast('Task deleted') } })} className="rounded-full p-2 text-ink-soft hover:bg-rose-tint hover:text-rose"><Trash2 size={15} /></button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      )}
      {form && <TaskForm ev={ev} initial={form.item} onClose={() => setForm(null)} />}
    </div>
  )
}
