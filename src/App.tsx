import { Shell } from './components/Shell'
import { Wizard } from './components/Wizard'
import { AssistantPage, EventPage, Workspace } from './pages/Workspace'
import { MyEvents, Overview } from './pages/Overview'
import { Settings } from './pages/Settings'
import { BudgetTab } from './tabs/BudgetTab'
import { TimelineTab } from './tabs/TimelineTab'
import { VendorsTab } from './tabs/VendorsTab'
import { StoreProvider, useApp } from './store'

function Router() {
  const { view, wizardOpen } = useApp()
  return (
    <Shell>
      <div key={view} className="rise">
        {view === 'overview' && <Overview />}
        {view === 'events' && <MyEvents />}
        {view === 'workspace' && <Workspace />}
        {view === 'budget' && <EventPage eyebrow="Budget Planner" title="Where the money goes">{(ev) => <BudgetTab ev={ev} />}</EventPage>}
        {view === 'timeline' && <EventPage eyebrow="Timeline & Tasks" title="Your road to the day">{(ev) => <TimelineTab ev={ev} />}</EventPage>}
        {view === 'vendors' && <EventPage eyebrow="Vendors" title="The people behind the day">{(ev) => <VendorsTab ev={ev} />}</EventPage>}
        {view === 'assistant' && <AssistantPage />}
        {view === 'settings' && <Settings />}
      </div>
      {wizardOpen && <Wizard />}
    </Shell>
  )
}

export default function App() {
  return <StoreProvider><Router /></StoreProvider>
}
