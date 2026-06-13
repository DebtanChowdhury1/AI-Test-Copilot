import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import { generateWithGemini } from '@/lib/gemini'
import { generateWithGroq } from '@/lib/groq'

export interface CoverageGap {
  area: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedTitle: string
}

export interface CoverageAnalysis {
  summary: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  gaps: CoverageGap[]
  strengths: string[]
  coverageMap: {
    functional: 'strong' | 'partial' | 'missing'
    regression: 'strong' | 'partial' | 'missing'
    edgeCases: 'strong' | 'partial' | 'missing'
    negative: 'strong' | 'partial' | 'missing'
    performance: 'strong' | 'partial' | 'missing'
    security: 'strong' | 'partial' | 'missing'
    accessibility: 'strong' | 'partial' | 'missing'
  }
}

function buildAnalysisPrompt(title: string, inputText: string, testCases: any[]): string {
  const casesSummary = testCases.map((tc, i) =>
    `${i + 1}. [${tc.category}/${tc.priority}] ${tc.title}`
  ).join('\n')

  return `You are a senior QA architect doing a coverage review. Analyze this test suite and identify what REAL production risks are NOT being tested.

SUITE: "${title}"
ORIGINAL REQUIREMENT:
${inputText?.trim() || '(not available)'}

CURRENT TEST CASES (${testCases.length} total):
${casesSummary}

Your job: Find the coverage gaps that could actually cause production incidents. Be specific and actionable, not generic.

Return ONLY this exact JSON (no markdown, no explanation):
{
  "summary": "1-2 sentence honest assessment of this suite's coverage",
  "riskLevel": "low|medium|high|critical",
  "strengths": ["specific thing this suite does well", "another strength"],
  "gaps": [
    {
      "area": "short area name (e.g. Security, Concurrency, Mobile, Error Recovery)",
      "description": "specific scenario not tested and why it matters in production",
      "severity": "low|medium|high|critical",
      "suggestedTitle": "concrete test case title they should add"
    }
  ],
  "coverageMap": {
    "functional": "strong|partial|missing",
    "regression": "strong|partial|missing",
    "edgeCases": "strong|partial|missing",
    "negative": "strong|partial|missing",
    "performance": "strong|partial|missing",
    "security": "strong|partial|missing",
    "accessibility": "strong|partial|missing"
  }
}

Identify 3-7 gaps. Focus on what could actually break in production, not theoretical issues.`
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const suite = await TestSuite.findOne({ _id: params.id, userId }).lean() as any
    if (!suite) return NextResponse.json({ error: 'Suite not found' }, { status: 404 })

    if (!suite.testCases?.length) {
      return NextResponse.json({ error: 'No test cases to analyze' }, { status: 400 })
    }

    const prompt = buildAnalysisPrompt(suite.title, suite.inputText, suite.testCases)

    let rawText: string
    try {
      rawText = await Promise.race([
        generateWithGemini(prompt),
        new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 15000)),
      ])
    } catch {
      rawText = await generateWithGroq(prompt)
    }

    // Parse response
    let text = rawText.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    let analysis: CoverageAnalysis

    try {
      analysis = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid AI response')
      analysis = JSON.parse(match[0])
    }

    return NextResponse.json(analysis)
  } catch (err) {
    console.error('[POST /api/suites/[id]/analyze]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 503 })
  }
}
