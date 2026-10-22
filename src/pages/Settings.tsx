import { useState } from 'react'
import { useApp } from '../store'
import { Button, Card, Field, SectionTitle, inputCls } from '../components/ui'

export function Settings() {
  const { profile, setProfile, simulateError, setSimulateError, toast, resetToSampleData } = useApp()
  const [f, setF] = useState(profile)
  const [err, setErr] = useState('')
  const save = () => {
    if (!f.name.trim()) return setErr('Name is required.')
    setErr(''); setProfile({ ...f, name: f.name.trim() }); toast('Profile updated for this session')
  }
  return (
    <div className="max-w-2xl">
      <SectionTitle eyebrow="Preferences" title="Settings" />
      <Card className="space-y-4 p-6">
        <h3 className="text-xl">Profile</h3>
        <Field label="Display name" error={err}>{(id) => <input id={id} className={inputCls(err)} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label="Email">{(id) => <input id={id} type="email" className={inputCls()} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
        <Button onClick={save}>Save profile</Button>
      </Card>
      <Card className="mt-6 p-6">
        <h3 className="text-xl">Prototype & Data tools</h3>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#78566f]" checked={simulateError} onChange={(e) => setSimulateError(e.target.checked)} />
          <span><span className="font-medium">Simulate generation errors</span><br /><span className="text-ink-soft">Makes the plan wizard and AI assistant show their error states so you can review them.</span></span>
        </label>
        <div className="mt-6 border-t border-line pt-4">
          <h4 className="text-sm font-medium">Reset Data</h4>
          <p className="mt-1 text-xs text-ink-soft">Reset your events, tasks, budget items, vendors, and ideas back to the original sample dataset.</p>
          <Button variant="danger" size="sm" className="mt-3" onClick={() => resetToSampleData()}>Reset to sample data</Button>
        </div>
        <p className="mt-4 text-xs text-ink-soft">All your changes are automatically saved to your browser&apos;s localStorage.</p>
      </Card>
    </div>
  )
}
