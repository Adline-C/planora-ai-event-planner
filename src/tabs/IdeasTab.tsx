import { Bookmark, BookmarkCheck, Lightbulb, Sparkles } from 'lucide-react'
import type { PlanEvent } from '../data'
import { useApp } from '../store'
import { Badge, Card, Empty } from '../components/ui'

export function IdeasTab({ ev }: { ev: PlanEvent }) {
  const { ideas, updateIdea, toast } = useApp()
  const list = ideas.filter((i) => i.eventId === ev.id)
  const saved = list.filter((i) => i.saved).length
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-ink-soft"><Sparkles size={15} className="text-plum" /> Suggestions tailored to “{ev.theme}”, {ev.guests} guests and your stated preferences. Illustrative, not confirmed.</p>
        <Badge tone="plum">{saved} saved</Badge>
      </div>
      {list.length === 0 ? <Empty icon={<Lightbulb size={20} />} title="No ideas yet" body="Ask the AI Event Assistant for suggestions and save the ones you love." /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <Card key={i.id} className={`flex flex-col p-5 ${i.saved ? '!border-plum/50 !bg-plum-tint/40' : ''}`}>
              <div className="flex items-center justify-between"><Badge tone="neutral">{i.kind}</Badge><Badge tone="sample">AI suggestion</Badge></div>
              <h3 className="mt-3 text-xl leading-snug">{i.title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-soft"><span className="font-medium text-ink">Why it fits: </span>{i.why}</p>
              <button aria-pressed={i.saved} aria-label={`${i.saved ? 'Remove' : 'Save'} idea: ${i.title}`} onClick={() => { updateIdea(i.id, { saved: !i.saved }); toast(i.saved ? 'Removed from saved ideas' : 'Saved to your event plan') }}
                className={`mt-4 flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${i.saved ? 'border-plum bg-plum text-white' : 'border-line hover:border-plum hover:text-plum-deep'}`}>
                {i.saved ? <><BookmarkCheck size={15} /> Saved</> : <><Bookmark size={15} /> Save idea</>}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
