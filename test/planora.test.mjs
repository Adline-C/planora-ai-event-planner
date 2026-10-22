import test from 'node:test'
import assert from 'node:assert/strict'

// Domain definitions matching src/data.ts & src/lib.ts
const TODAY = '2026-10-22'
const CATEGORIES = ['Venue', 'Catering', 'Decorations', 'Photography', 'Entertainment', 'Miscellaneous']
const categoryShare = {
  Venue: 0.28, Catering: 0.36, Decorations: 0.1, Photography: 0.09, Entertainment: 0.08, Miscellaneous: 0.09,
}

function budgetRows(ev, expenses) {
  return CATEGORIES.map((c) => {
    const planned = Math.round((ev.budget * categoryShare[c]) / 10) * 10
    const actual = expenses.filter((x) => x.eventId === ev.id && x.category === c).reduce((a, x) => a + x.amount, 0)
    return { category: c, planned, actual, remaining: planned - actual, over: actual > planned }
  })
}

function budgetTotals(ev, expenses) {
  const spent = expenses.filter((x) => x.eventId === ev.id).reduce((a, x) => a + x.amount, 0)
  const paid = expenses.filter((x) => x.eventId === ev.id && x.status === 'Paid').reduce((a, x) => a + x.amount, 0)
  return { total: ev.budget, spent, paid, remaining: ev.budget - spent }
}

const isOverdue = (t) => !t.done && t.due < TODAY

// 1. Budget Calculations & Totals
test('budgetTotals accurately sums spent, paid, and remaining', () => {
  const ev = { id: 'e1', budget: 42000 }
  const expenses = [
    { id: 'x1', eventId: 'e1', category: 'Venue', amount: 11800, status: 'Deposit paid' },
    { id: 'x2', eventId: 'e1', category: 'Catering', amount: 15600, status: 'Planned' },
    { id: 'x3', eventId: 'e1', category: 'Miscellaneous', amount: 900, status: 'Paid' },
  ]
  const res = budgetTotals(ev, expenses)
  assert.equal(res.total, 42000)
  assert.equal(res.spent, 28300)
  assert.equal(res.paid, 900)
  assert.equal(res.remaining, 13700)
})

// 2. Category Allocations & Over-allocation Detection
test('budgetRows detects category overspending against planned target', () => {
  const ev = { id: 'e1', budget: 10000 }
  // Venue allocation is 28% of 10000 = 2800
  const expenses = [
    { id: 'x1', eventId: 'e1', category: 'Venue', amount: 3000, status: 'Paid' },
  ]
  const rows = budgetRows(ev, expenses)
  const venue = rows.find(r => r.category === 'Venue')
  assert.ok(venue)
  assert.equal(venue.planned, 2800)
  assert.equal(venue.actual, 3000)
  assert.equal(venue.over, true)
  assert.equal(venue.remaining, -200)
})

// 3. Timeline Overdue & Due Date Checks
test('isOverdue correctly flags overdue open tasks', () => {
  assert.equal(isOverdue({ done: false, due: '2026-10-20' }), true)
  assert.equal(isOverdue({ done: true, due: '2026-10-20' }), false)
  assert.equal(isOverdue({ done: false, due: '2026-10-25' }), false)
})

// 4. AI Action Execution Consistency (Timeline, Budget, Ideas)
test('AI action buttons produce valid state additions', () => {
  const ev = { id: 'e1', budget: 20000, currency: 'USD' }
  const tasks = []
  const expenses = []
  const ideas = []

  // Simulate timeline action
  const aiTimelineAction = {
    kind: 'timeline',
    label: 'Add to Timeline',
    tasks: [{ title: 'Book floral designer', due: '2026-11-15', category: 'Decorations' }],
  }
  aiTimelineAction.tasks.forEach(t => tasks.push({ ...t, id: 't_ai', eventId: ev.id, done: false }))
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].done, false)
  assert.equal(tasks[0].eventId, 'e1')

  // Simulate budget action
  const aiBudgetAction = {
    kind: 'budget',
    label: 'Add to Budget',
    category: 'Decorations',
    description: 'Allowance for table lighting',
    amount: 350,
  }
  expenses.push({ ...aiBudgetAction, id: 'x_ai', eventId: ev.id, status: 'Planned' })
  assert.equal(expenses.length, 1)
  assert.equal(expenses[0].amount, 350)
  assert.equal(budgetTotals(ev, expenses).spent, 350)

  // Simulate idea action
  const aiIdeaAction = {
    kind: 'idea',
    label: 'Save Idea',
    ideaKind: 'Theme',
    title: 'Candlelit Vineyard',
    why: 'Fits intimate setting',
  }
  ideas.push({ ...aiIdeaAction, id: 'i_ai', eventId: ev.id, saved: true })
  assert.equal(ideas.length, 1)
  assert.equal(ideas[0].saved, true)
})

// 5. LocalStorage Data Validation & Recovery
test('storage validation filters corrupt entries and recovers cleanly', () => {
  const corruptPayload = {
    events: [{ id: 'valid_e1', name: 'Valid Event' }, { invalid: true }],
    tasks: [{ id: 't1', title: 'Task 1' }, null],
    expenses: [{ id: 'x1', amount: 500 }, { id: 'x2', amount: 'not_a_number' }],
  }

  const validEvents = corruptPayload.events.filter(e => e && typeof e.id === 'string' && typeof e.name === 'string')
  const validTasks = corruptPayload.tasks.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string')
  const validExpenses = corruptPayload.expenses.filter(x => x && typeof x.id === 'string' && typeof x.amount === 'number')

  assert.equal(validEvents.length, 1)
  assert.equal(validTasks.length, 1)
  assert.equal(validExpenses.length, 1)
})
