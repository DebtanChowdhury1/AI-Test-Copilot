import { generateWithGemini } from './gemini'
import { generateWithGroq } from './groq'

export interface TestCase {
  id: string
  title: string
  category: 'positive' | 'negative' | 'edge_case'
  priority: 'low' | 'medium' | 'high' | 'critical'
  preconditions: string
  steps: string[]
  expectedResult: string
  status: 'not_run' | 'pass' | 'fail' | 'blocked'
  notes: string
}

export interface GenerationResult {
  testCases: TestCase[]
  modelUsed: string
  fallbackUsed: boolean
  generationTime: number
}

export interface GenerationInput {
  inputType: string
  priority: string
  testingTypes: string[]
  userStory: string
  model: 'gemini' | 'groq' | 'auto'
}

// Per-type guidance — AI decides exact count based on complexity, these are targets
const TYPE_ALLOCATION: Record<string, string> = {
  Functional:    '3–8 cases — one per distinct user flow or action. Cover every core happy path.',
  Regression:    '2–5 cases — highest-risk areas where this change could silently break existing behaviour.',
  'Edge Cases':  '2–6 cases — boundary values, empty inputs, max limits, special characters, concurrent actions.',
  Negative:      '2–5 cases — invalid inputs, missing required fields, unauthorised access, graceful error handling.',
  Performance:   '2–4 cases — response time under load, concurrency, timeouts, large data volumes.',
  Security:      '2–4 cases — auth bypass, injection attacks, sensitive data exposure, privilege escalation.',
  Accessibility: '2–4 cases — keyboard navigation, screen-reader labels, focus management, colour contrast.',
}

const PRIORITY_GUIDANCE: Record<string, string> = {
  low:      'Lean toward fewer, high-confidence cases. Skip speculative edge cases.',
  medium:   'Balance coverage with practicality. Include the most likely edge and negative cases.',
  high:     'Thorough coverage. Include all realistic edge cases and negative paths.',
  critical: 'Maximum coverage. Generate toward the upper end of each type\'s range. No gaps.',
}

function buildPrompt(input: GenerationInput): string {
  const typeInstructions = input.testingTypes
    .map(t => `  • ${t}: ${TYPE_ALLOCATION[t] ?? '2–4 cases relevant to this type'}`)
    .join('\n')

  const priorityNote = PRIORITY_GUIDANCE[input.priority] ?? PRIORITY_GUIDANCE.medium

  const inputLabel =
    input.inputType === 'user_story' ? 'User Story' :
    input.inputType === 'feature_spec' ? 'Feature Specification' : 'Bug Report'

  return `You are a senior QA architect. Generate production-quality test cases for the requirement below.

━━━ REQUIREMENT (${inputLabel}) ━━━
${input.userStory.trim()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TESTING SCOPE — generate cases ONLY for these types:
${typeInstructions}

PRIORITY: ${input.priority.toUpperCase()} — ${priorityNote}

QUALITY RULES (strictly enforced):
1. Each test case must be unique — zero duplicate coverage.
2. Every test must be independently executable with clear, numbered steps.
3. Titles must be specific and action-oriented (e.g. "Submit login form with expired password" not "Test login").
4. Steps must be concrete actions a tester can follow without guessing.
5. Expected results must be precise and verifiable — no vague "should work" language.
6. Scale count to actual complexity — simple single-flow features need fewer cases; complex multi-flow features need more.
7. Never pad with trivial or redundant cases just to inflate the count.

CATEGORY MAPPING:
- "positive"   → Functional happy paths, Regression, Performance normal-load, Accessibility
- "negative"   → Negative testing, Security attacks, unauthorised/invalid scenarios
- "edge_case"  → Edge Cases, boundary conditions, unusual-but-valid inputs

Return ONLY a valid JSON array — no markdown fences, no explanation, no wrapper object:
[{
  "id": "TC-001",
  "title": "string",
  "category": "positive|negative|edge_case",
  "priority": "low|medium|high|critical",
  "preconditions": "string",
  "steps": ["Step 1: ...", "Step 2: ..."],
  "expectedResult": "string",
  "status": "not_run",
  "notes": ""
}]`
}

function parseTestCases(raw: string): TestCase[] {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found in response')
    parsed = JSON.parse(match[0])
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>
    const firstArrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]))
    if (firstArrayKey) {
      parsed = obj[firstArrayKey]
    } else {
      throw new Error('Unexpected JSON structure from AI')
    }
  }

  if (!Array.isArray(parsed)) throw new Error('AI response is not a JSON array')

  return (parsed as Record<string, unknown>[]).map((item, index) => {
    const num = String(index + 1).padStart(3, '0')
    return {
      id: String(item.id ?? `TC-${num}`),
      title: String(item.title ?? 'Untitled Test Case'),
      category: (['positive', 'negative', 'edge_case'].includes(String(item.category))
        ? item.category
        : 'positive') as TestCase['category'],
      priority: (['low', 'medium', 'high', 'critical'].includes(String(item.priority))
        ? item.priority
        : 'medium') as TestCase['priority'],
      preconditions: String(item.preconditions ?? ''),
      steps: Array.isArray(item.steps) ? item.steps.map(String) : [],
      expectedResult: String(item.expectedResult ?? ''),
      status: 'not_run' as const,
      notes: String(item.notes ?? ''),
    }
  })
}

export async function generateTestCases(input: GenerationInput): Promise<GenerationResult> {
  const startTime = Date.now()
  const prompt = buildPrompt(input)

  if (input.model === 'gemini' || input.model === 'auto') {
    try {
      const raw = await Promise.race([
        generateWithGemini(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 15000)
        ),
      ])
      const testCases = parseTestCases(raw)
      return { testCases, modelUsed: 'gemini-2.0-flash', fallbackUsed: false, generationTime: Date.now() - startTime }
    } catch (err) {
      if (input.model === 'gemini') throw err
      console.warn('Gemini failed, falling back to Groq:', err)
    }
  }

  const raw = await generateWithGroq(prompt)
  const testCases = parseTestCases(raw)
  return {
    testCases,
    modelUsed: 'llama-3.1-8b-instant',
    fallbackUsed: input.model === 'auto',
    generationTime: Date.now() - startTime,
  }
}
