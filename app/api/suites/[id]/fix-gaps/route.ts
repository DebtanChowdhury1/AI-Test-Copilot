import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import { generateWithGemini } from '@/lib/gemini'
import { generateWithGroq } from '@/lib/groq'
import type { CoverageGap } from '@/app/api/suites/[id]/analyze/route'
import { TestCase } from '@/lib/ai-router'

function buildFixPrompt(suiteTitle: string, gaps: CoverageGap[]): string {
  const gapList = gaps.map((g, i) =>
    `${i + 1}. [${g.severity.toUpperCase()}] ${g.area}\n   Issue: ${g.description}\n   Suggested title: "${g.suggestedTitle}"`
  ).join('\n\n')

  return `You are a senior QA engineer. Generate complete, executable test cases to fix these specific coverage gaps in the test suite "${suiteTitle}".

GAPS TO FIX:
${gapList}

For EACH gap, generate exactly ONE detailed test case that directly addresses it.

QUALITY RULES:
- Title must match (or improve on) the suggested title
- Steps must be specific and executable (3–6 steps minimum)
- Expected result must be precise and verifiable
- Preconditions must set up the exact scenario described

Return ONLY a valid JSON array — one test case per gap, in the same order:
[{
  "id": "TC-001",
  "title": "string",
  "category": "positive|negative|edge_case",
  "priority": "low|medium|high|critical",
  "preconditions": "string",
  "steps": ["Step 1: ...", "Step 2: ..."],
  "expectedResult": "string",
  "status": "not_run",
  "notes": "Addresses coverage gap: [area]"
}]`
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { gaps } = await req.json() as { gaps: CoverageGap[] }
    if (!gaps?.length) return NextResponse.json({ error: 'No gaps provided' }, { status: 400 })

    await connectDB()
    const suite = await TestSuite.findOne({ _id: params.id, userId }).lean() as any
    if (!suite) return NextResponse.json({ error: 'Suite not found' }, { status: 404 })

    const prompt = buildFixPrompt(suite.title, gaps)

    let rawText: string
    try {
      rawText = await Promise.race([
        generateWithGemini(prompt),
        new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 15000)),
      ])
    } catch {
      rawText = await generateWithGroq(prompt)
    }

    let text = rawText.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    let parsed: unknown
    try { parsed = JSON.parse(text) } catch {
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array in response')
      parsed = JSON.parse(match[0])
    }

    if (!Array.isArray(parsed)) throw new Error('Response is not an array')

    const existingCount = suite.testCases?.length ?? 0
    const newCases: TestCase[] = (parsed as any[]).map((item, i) => ({
      id: `TC-${String(existingCount + i + 1).padStart(3, '0')}`,
      title: String(item.title ?? gaps[i]?.suggestedTitle ?? 'Test Case'),
      category: (['positive', 'negative', 'edge_case'].includes(item.category) ? item.category : 'negative') as TestCase['category'],
      priority: (['low', 'medium', 'high', 'critical'].includes(item.priority) ? item.priority : 'medium') as TestCase['priority'],
      preconditions: String(item.preconditions ?? ''),
      steps: Array.isArray(item.steps) ? item.steps.map(String) : [],
      expectedResult: String(item.expectedResult ?? ''),
      status: 'not_run' as const,
      notes: String(item.notes ?? `Addresses coverage gap: ${gaps[i]?.area ?? ''}`),
    }))

    return NextResponse.json({ testCases: newCases })
  } catch (err) {
    console.error('[POST /api/suites/[id]/fix-gaps]', err)
    return NextResponse.json({ error: 'Failed to generate fixes' }, { status: 503 })
  }
}
