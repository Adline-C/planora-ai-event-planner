import { useState } from 'react'
import { Handshake, Mail, Pencil, Plus, Trash2 } from 'lucide-react'
import { CATEGORIES, VENDOR_STATUSES, money, type PlanEvent, type Vendor, type VendorStatus } from '../data'
import { useApp } from '../store'
import { Badge, Button, Card, Empty, Field, Modal, inputCls } from '../components/ui'

const CATS = [...CATEGORIES.filter((c) => c !== 'Miscellaneous'), 'Other']

function VendorForm({ ev, initial, onClose }: { ev: PlanEvent; initial?: Vendor; onClose: () => void }) {
  const { addVendor, updateVendor, toast } = useApp()
  const [f, setF] = useState({ name: initial?.name ?? '', category: initial?.category ?? CATS[0], contact: initial?.contact ?? '', quote: initial ? String(initial.quote) : '', status: (initial?.status ?? 'To Contact') as VendorStatus })
  const [err, setErr] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    if (!f.name.trim()) e.name = 'Enter a vendor name.'
    if (!f.contact.trim()) e.contact = 'Add an email or phone number.'
    if (f.quote && +f.quote < 0) e.quote = 'Quote cannot be negative.'
    setErr(e)
    if (Object.keys(e).length) return
    const d = { name: f.name.trim(), category: f.category, contact: f.contact.trim(), quote: +f.quote || 0, status: f.status }
    if (initial) updateVendor(initial.id, d); else addVendor({ ...d, eventId: ev.id })
    toast(initial ? 'Vendor updated' : 'Vendor added'); onClose()
  }
  return (
    <Modal title={initial ? 'Edit vendor' : 'Add vendor'} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>{initial ? 'Save changes' : 'Add vendor'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Vendor name" error={err.name}>{(id) => <input id={id} className={inputCls(err.name)} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field></div>
        <Field label="Category">{(id) => <select id={id} className={inputCls()} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
        <Field label="Booking status">{(id) => <select id={id} className={inputCls()} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as VendorStatus })}>{VENDOR_STATUSES.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
        <Field label="Contact (email or phone)" error={err.contact}>{(id) => <input id={id} className={inputCls(err.contact)} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} />}</Field>
        <Field label={`Quoted price (${ev.currency})`} error={err.quote} hint="Leave empty if no quote yet.">{(id) => <input id={id} type="number" min={0} className={inputCls(err.quote)} value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} />}</Field>
      </div>
    </Modal>
  )
}

export function VendorsTab({ ev }: { ev: PlanEvent }) {
  const { vendors, updateVendor, deleteVendor, setConfirm, toast } = useApp()
  const [form, setForm] = useState<{ item?: Vendor } | null>(null)
  const list = vendors.filter((v) => v.eventId === ev.id)
  const tone = (s: VendorStatus) => (s === 'Booked' ? 'sage' : s === 'Quoted' ? 'plum' : 'neutral') as 'sage' | 'plum' | 'neutral'

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-soft">Vendors marked <Badge tone="sample">Sample</Badge> are placeholder entries for illustration. They are not real, verified businesses, and their prices are not real quotes.</p>
        <Button size="sm" onClick={() => setForm({})}><Plus size={14} /> Add vendor</Button>
      </div>
      {list.length === 0 ? (
        <Empty icon={<Handshake size={20} />} title="No vendors yet" body="Track venues, caterers and other services you are considering." action={<Button size="sm" onClick={() => setForm({})}>Add vendor</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[11px] font-semibold uppercase tracking-wider text-plum">{v.category}</p><h3 className="mt-0.5 text-lg leading-snug">{v.name}</h3></div>
                {v.sample ? <Badge tone="sample">Sample</Badge> : <Badge tone="sage">Yours</Badge>}
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft"><Mail size={14} /> {v.contact}</p>
              <p className="mt-1 text-sm">Quoted price: <strong>{v.quote ? money(v.quote, ev.currency) : 'Not yet quoted'}</strong></p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                <label className="flex items-center gap-2 text-xs text-ink-soft">Status
                  <select aria-label={`Booking status for ${v.name}`} value={v.status} onChange={(e) => { updateVendor(v.id, { status: e.target.value as VendorStatus }); toast(`${v.name}: ${e.target.value}`) }} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink focus:border-plum">
                    {VENDOR_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <div className="flex items-center gap-1">
                  <Badge tone={tone(v.status)}>{v.status}</Badge>
                  <button aria-label={`Edit ${v.name}`} onClick={() => setForm({ item: v })} className="rounded-full p-2 text-ink-soft hover:bg-champagne"><Pencil size={15} /></button>
                  <button aria-label={`Delete ${v.name}`} onClick={() => setConfirm({ title: 'Remove vendor?', body: `${v.name} will be removed from this event.`, action: 'Remove', onConfirm: () => { deleteVendor(v.id); toast('Vendor removed') } })} className="rounded-full p-2 text-ink-soft hover:bg-rose-tint hover:text-rose"><Trash2 size={15} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {form && <VendorForm ev={ev} initial={form.item} onClose={() => setForm(null)} />}
    </div>
  )
}
