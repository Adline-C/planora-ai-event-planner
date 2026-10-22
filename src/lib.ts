import { CATEGORIES, TODAY, categoryShare, type Expense, type PlanEvent, type Task } from './data'

export function budgetRows(ev: PlanEvent, expenses: Expense[]) {
  return CATEGORIES.map((c) => {
    const planned = Math.round((ev.budget * categoryShare[c]) / 10) * 10
    const actual = expenses.filter((x) => x.eventId === ev.id && x.category === c).reduce((a, x) => a + x.amount, 0)
    return { category: c, planned, actual, remaining: planned - actual, over: actual > planned }
  })
}
export function budgetTotals(ev: PlanEvent, expenses: Expense[]) {
  const spent = expenses.filter((x) => x.eventId === ev.id).reduce((a, x) => a + x.amount, 0)
  const paid = expenses.filter((x) => x.eventId === ev.id && x.status === 'Paid').reduce((a, x) => a + x.amount, 0)
  return { total: ev.budget, spent, paid, remaining: ev.budget - spent }
}
export const isOverdue = (t: Task) => !t.done && t.due < TODAY
