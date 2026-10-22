export type EventType = 'Wedding' | 'Birthday' | 'Anniversary' | 'Community Event' | 'Other'
export type PayStatus = 'Planned' | 'Deposit paid' | 'Paid'
export type VendorStatus = 'To Contact' | 'Contacted' | 'Quoted' | 'Booked'

export interface PlanEvent {
  id: string
  name: string
  type: EventType
  date: string
  location: string
  guests: number
  budget: number
  currency: string
  theme: string
  palette: string
  food: string
  needs: string
  image: string
  sample: boolean
}
export interface Task {
  id: string
  eventId: string
  title: string
  due: string
  category: string
  done: boolean
}
export interface Expense {
  id: string
  eventId: string
  category: string
  description: string
  amount: number
  status: PayStatus
}
export interface Vendor {
  id: string
  eventId: string
  name: string
  category: string
  contact: string
  quote: number
  status: VendorStatus
  sample: boolean
}
export interface Idea {
  id: string
  eventId: string
  kind: string
  title: string
  why: string
  saved: boolean
}

export const TODAY = '2026-10-22'
export const CATEGORIES = ['Venue', 'Catering', 'Decorations', 'Photography', 'Entertainment', 'Miscellaneous']
export const EVENT_TYPES: EventType[] = ['Wedding', 'Birthday', 'Anniversary', 'Community Event', 'Other']
export const VENDOR_STATUSES: VendorStatus[] = ['To Contact', 'Contacted', 'Quoted', 'Booked']
export const PAY_STATUSES: PayStatus[] = ['Planned', 'Deposit paid', 'Paid']
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR']

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&h=800&fit=crop&auto=format`
export const HERO_IMG = `https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&h=900&fit=crop&auto=format`
export const DEFAULT_IMG: Record<EventType, string> = {
  Wedding: img('1525441273400-056e9c7517b3'),
  Birthday: img('1536392706976-e486e2ba97af'),
  Anniversary: img('1525441273400-056e9c7517b3'),
  'Community Event': img('1792411269498-cadf9ebb1846'),
  Other: img('1536392706976-e486e2ba97af'),
}

export const seedEvents: PlanEvent[] = [
  {
    id: 'e1', name: 'Amara & Daniel’s Wedding', type: 'Wedding', date: '2027-05-15',
    location: 'Hollis Garden Estate, Napa Valley', guests: 120, budget: 42000, currency: 'USD',
    theme: 'Garden romance', palette: 'Ivory, sage, dusty plum', food: 'Seasonal farm-to-table, vegetarian-friendly',
    needs: 'Step-free access to ceremony lawn; 6 guests with nut allergies', image: DEFAULT_IMG.Wedding, sample: true,
  },
  {
    id: 'e2', name: 'Maya’s 30th Birthday Supper', type: 'Birthday', date: '2026-12-12',
    location: 'The Greenhouse Room, Portland', guests: 36, budget: 5500, currency: 'USD',
    theme: 'Candlelit winter greenhouse', palette: 'Champagne, forest green, blush', food: 'Shared plates, pescatarian options',
    needs: 'Quiet corner for older relatives', image: DEFAULT_IMG.Birthday, sample: true,
  },
  {
    id: 'e3', name: 'Riverside Harvest Supper', type: 'Community Event', date: '2026-11-14',
    location: 'Riverside Commons, Asheville', guests: 85, budget: 3200, currency: 'USD',
    theme: 'Long-table harvest', palette: 'Terracotta, wheat, sage', food: 'Potluck + hosted mains, vegan and halal options',
    needs: 'Wheelchair-accessible seating; covered area in case of rain', image: DEFAULT_IMG['Community Event'], sample: true,
  },
]

const t = (id: string, eventId: string, title: string, due: string, category: string, done = false): Task => ({ id, eventId, title, due, category, done })
export const seedTasks: Task[] = [
  t('t1', 'e1', 'Confirm venue contract and deposit', '2026-09-30', 'Venue', true),
  t('t2', 'e1', 'Send save-the-dates', '2026-10-15', 'Miscellaneous', true),
  t('t3', 'e1', 'Book photographer', '2026-10-18', 'Photography'),
  t('t4', 'e1', 'Menu tasting with caterer', '2026-11-20', 'Catering'),
  t('t5', 'e1', 'Order floral samples', '2027-01-10', 'Decorations'),
  t('t6', 'e1', 'Mail formal invitations', '2027-03-15', 'Miscellaneous'),
  t('t7', 'e1', 'Final guest count to caterer', '2027-05-01', 'Catering'),
  t('t8', 'e2', 'Reserve greenhouse room', '2026-10-05', 'Venue', true),
  t('t9', 'e2', 'Send invitations', '2026-10-25', 'Miscellaneous'),
  t('t10', 'e2', 'Finalize shared-plate menu', '2026-11-10', 'Catering'),
  t('t11', 'e2', 'Order cake', '2026-11-28', 'Catering'),
  t('t12', 'e2', 'Create playlist and confirm speaker', '2026-12-05', 'Entertainment'),
  t('t13', 'e3', 'Secure city permit for Commons', '2026-10-10', 'Venue', true),
  t('t14', 'e3', 'Recruit 10 volunteers', '2026-10-20', 'Miscellaneous'),
  t('t15', 'e3', 'Rent tables and a rain tent', '2026-10-30', 'Venue'),
  t('t16', 'e3', 'Publish potluck sign-up sheet', '2026-10-27', 'Catering'),
  t('t17', 'e3', 'Confirm local band', '2026-11-03', 'Entertainment'),
]

const x = (id: string, eventId: string, category: string, description: string, amount: number, status: PayStatus): Expense => ({ id, eventId, category, description, amount, status })
export const seedExpenses: Expense[] = [
  x('x1', 'e1', 'Venue', 'Hollis Garden Estate rental', 11800, 'Deposit paid'),
  x('x2', 'e1', 'Catering', 'Dinner service, 120 guests', 15600, 'Planned'),
  x('x3', 'e1', 'Decorations', 'Florals and lighting', 4200, 'Planned'),
  x('x4', 'e1', 'Photography', 'Photographer, 8 hours', 3900, 'Planned'),
  x('x5', 'e1', 'Entertainment', 'String quartet and DJ', 2400, 'Planned'),
  x('x6', 'e1', 'Miscellaneous', 'Stationery and favours', 900, 'Paid'),
  x('x7', 'e2', 'Venue', 'Greenhouse room hire', 1600, 'Paid'),
  x('x8', 'e2', 'Catering', 'Shared plates + drinks', 2200, 'Planned'),
  x('x9', 'e2', 'Decorations', 'Candles, greenery', 650, 'Planned'),
  x('x10', 'e2', 'Entertainment', 'Live acoustic set', 700, 'Planned'),
  x('x11', 'e3', 'Venue', 'Tables, chairs, rain tent', 1100, 'Planned'),
  x('x12', 'e3', 'Catering', 'Hosted mains', 1250, 'Planned'),
  x('x13', 'e3', 'Entertainment', 'Local band honorarium', 500, 'Planned'),
  x('x14', 'e3', 'Miscellaneous', 'Permit fee', 150, 'Paid'),
]

export const categoryShare: Record<string, number> = {
  Venue: 0.28, Catering: 0.36, Decorations: 0.1, Photography: 0.09, Entertainment: 0.08, Miscellaneous: 0.09,
}

const v = (id: string, eventId: string, name: string, category: string, contact: string, quote: number, status: VendorStatus): Vendor => ({ id, eventId, name, category, contact, quote, status, sample: true })
export const seedVendors: Vendor[] = [
  v('v1', 'e1', 'Sample Venue Co.', 'Venue', 'hello@example.com', 11800, 'Booked'),
  v('v2', 'e1', 'Sample Table & Fork Catering', 'Catering', '555-0142', 15600, 'Quoted'),
  v('v3', 'e1', 'Sample Lens Studio', 'Photography', 'studio@example.com', 3900, 'Contacted'),
  v('v4', 'e1', 'Sample Bloom Atelier', 'Decorations', '555-0188', 0, 'To Contact'),
  v('v5', 'e2', 'Sample Candle & Fern', 'Decorations', 'hello@example.org', 650, 'Quoted'),
  v('v6', 'e2', 'Sample Acoustic Duo', 'Entertainment', '555-0119', 700, 'Contacted'),
  v('v7', 'e3', 'Sample Rental Depot', 'Venue', '555-0166', 1100, 'Quoted'),
  v('v8', 'e3', 'Sample Riverbend Band', 'Entertainment', 'band@example.net', 500, 'To Contact'),
]

const i = (id: string, eventId: string, kind: string, title: string, why: string): Idea => ({ id, eventId, kind, title, why, saved: false })
export const seedIdeas: Idea[] = [
  i('i1', 'e1', 'Theme', 'Orchard Dusk', 'Blends your sage and plum palette with warm evening light; fits an outdoor Napa setting.'),
  i('i2', 'e1', 'Décor', 'Seasonal herb centrepieces', 'Rosemary and sage bundles double as favours and keep floral costs down.'),
  i('i3', 'e1', 'Menu', 'Family-style vegetarian courses', 'Matches your farm-to-table preference and eases the nut-allergy labelling.'),
  i('i4', 'e1', 'Entertainment', 'Quartet ceremony, DJ after dinner', 'Gives a quiet, elegant ceremony and a lively reception without two full bands.'),
  i('i5', 'e1', 'Guest activity', 'Handwritten advice cards', 'Low-cost keepsake for the couple that guests can fill in during cocktail hour.'),
  i('i6', 'e1', 'Décor', 'Step-free pathway lanterns', 'Lights the accessible route to the ceremony lawn and doubles as ambience.'),
  i('i7', 'e2', 'Theme', 'Winter Greenhouse Supper', 'Candlelight and greenery suit your venue and champagne-and-green palette.'),
  i('i8', 'e2', 'Menu', 'Shared-plate tasting menu', 'Encourages conversation for 36 guests and covers pescatarian needs.'),
  i('i9', 'e2', 'Guest activity', 'Memory jar toast', 'Guests write a memory for Maya; read a few aloud at dessert.'),
  i('i10', 'e3', 'Theme', 'Long-table Harvest', 'One continuous table builds community and keeps rentals simple.'),
  i('i11', 'e3', 'Menu', 'Labelled potluck stations', 'Vegan and halal labels let all 85 guests eat confidently.'),
  i('i12', 'e3', 'Guest activity', 'Neighbour story circle', 'Short prompts at each table help neighbours who do not yet know one another.'),
]

export const money = (n: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
export const fmtDate = (d: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', opts)
export const daysUntil = (d: string) =>
  Math.round((new Date(d + 'T12:00:00').getTime() - new Date(TODAY + 'T12:00:00').getTime()) / 86400000)
