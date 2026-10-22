export interface AssistantEventContext {
  id?: string
  name?: string
  type?: string
  date?: string
  location?: string
  guests?: number | string
  budget?: number | string
  currency?: string
  theme?: string
  palette?: string
  food?: string
  needs?: string
}

export interface AssistantRequestPayload {
  question?: string
  event?: AssistantEventContext
}

export type Action =
  | { kind: 'timeline'; label: string; tasks: { title: string; due: string; category: string }[] }
  | { kind: 'idea'; label: string; ideaKind: string; title: string; why: string }
  | { kind: 'budget'; label: string; category: string; description: string; amount: number }

export interface Answer {
  intro: string
  suggestions: { title: string; detail: string }[]
  actions: Action[]
}

const cleanStr = (val: unknown, max = 150): string =>
  typeof val === 'string' ? val.trim().slice(0, max) : ''

export async function processAssistantRequest(
  payload: AssistantRequestPayload,
  apiKey?: string
): Promise<{ status: number; data: Answer | { error: string } }> {
  const question = typeof payload?.question === 'string' ? payload.question.trim().slice(0, 500) : ''
  const ev = payload?.event && typeof payload.event === 'object' ? payload.event : {}

  if (!question) {
    return { status: 400, data: { error: 'A valid question is required.' } }
  }

  if (!apiKey) {
    return {
      status: 503,
      data: {
        error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment.'
      }
    }
  }

  const safeName = cleanStr(ev.name) || 'Unnamed Event'
  const safeType = cleanStr(ev.type) || 'Event'
  const safeDate = cleanStr(ev.date, 20) || 'Upcoming'
  const safeLoc = cleanStr(ev.location) || 'Unspecified'
  const safeGuests = Number(ev.guests) || 'Not specified'
  const safeBudget = Number(ev.budget) || 0
  const safeCurrency = cleanStr(ev.currency, 10) || 'USD'
  const safeTheme = cleanStr(ev.theme) || 'None specified'
  const safePalette = cleanStr(ev.palette) || 'None specified'
  const safeFood = cleanStr(ev.food) || 'None specified'
  const safeNeeds = cleanStr(ev.needs) || 'None specified'

  const systemPrompt = `You are Planora's GenAI event planning copilot.
You assist event hosts with budget guidance, timeline tasks, decor/theme ideas, vendor advice, and planning checklists.
The user is planning the following event:
- Name: ${safeName}
- Type: ${safeType}
- Date: ${safeDate}
- Location: ${safeLoc}
- Guest count: ${safeGuests}
- Overall Budget: ${safeBudget} ${safeCurrency}
- Preferred Theme/Style: ${safeTheme}
- Color Palette: ${safePalette}
- Food Preferences: ${safeFood}
- Special Requirements/Accessibility: ${safeNeeds}
- Reference Today's Date: 2026-10-22

Return ONLY a valid JSON object with the following exact schema:
{
  "intro": "A concise, supportive overview sentence or paragraph tailored directly to this event.",
  "suggestions": [
    {
      "title": "Clear concise heading",
      "detail": "Specific actionable recommendation referencing the event details or budget."
    }
  ],
  "actions": [
    // Include 1 to 3 relevant action buttons from the allowed kinds below:
    // Kind 1: Timeline action (adds tasks to user's timeline)
    // { "kind": "timeline", "label": "Add to Timeline", "tasks": [{ "title": "Task name", "due": "YYYY-MM-DD", "category": "Venue" | "Catering" | "Decorations" | "Photography" | "Entertainment" | "Miscellaneous" }] }
    // Kind 2: Idea action (saves inspiration card)
    // { "kind": "idea", "label": "Save Idea", "ideaKind": "Theme" | "Menu" | "Décor" | "Guest activity" | "Budget", "title": "Idea title", "why": "Explanation why it fits their palette/theme/guests" }
    // Kind 3: Budget action (adds expense line item)
    // { "kind": "budget", "label": "Add to Budget", "category": "Venue" | "Catering" | "Decorations" | "Photography" | "Entertainment" | "Miscellaneous", "description": "Expense item description", "amount": number }
  ]
}

Important rules:
1. All dates in timeline tasks must be in "YYYY-MM-DD" format and not in the past relative to 2026-10-22.
2. Amounts in budget actions must be positive numbers rounded to whole units.
3. Every suggestion and action must align with the event type, budget, guest count, and theme.
4. Output strictly valid JSON. Do not include markdown code fence formatting like \`\`\`json.`

  const geminiPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7
    }
  }

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash-lite']
  let apiResponse: Response | null = null
  let lastErrText = ''

  for (const model of candidateModels) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    const resp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    })
    if (resp.ok) {
      apiResponse = resp
      break
    }
    lastErrText = await resp.text()
  }

  if (!apiResponse || !apiResponse.ok) {
    return {
      status: 502,
      data: { error: `Gemini API request failed: ${lastErrText}` }
    }
  }

  const data = await apiResponse.json()
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidateText) {
    return {
      status: 502,
      data: { error: 'Gemini returned an empty response.' }
    }
  }

  let parsed: any
  try {
    const cleanText = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    parsed = JSON.parse(cleanText)
  } catch {
    return {
      status: 502,
      data: { error: 'Failed to parse Gemini response as valid JSON.' }
    }
  }

  const answer: Answer = {
    intro: typeof parsed?.intro === 'string' ? parsed.intro : 'Here are recommendations for your event.',
    suggestions: Array.isArray(parsed?.suggestions)
      ? parsed.suggestions.map((s: any) => ({
          title: String(s?.title || ''),
          detail: String(s?.detail || '')
        }))
      : [],
    actions: Array.isArray(parsed?.actions)
      ? parsed.actions.filter((a: any) => a && typeof a.kind === 'string' && typeof a.label === 'string')
      : []
  }

  return { status: 200, data: answer }
}
