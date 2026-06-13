import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import { generateTestCases, TestCase } from '@/lib/ai-router'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    // mode: 'replace' — return only new cases; 'merge' — return existing + new (deduped by title)
    const { mode = 'replace', testingTypes } = body as { mode?: 'replace' | 'merge'; testingTypes?: string[] }

    await connectDB()
    const suite = await TestSuite.findOne({ _id: params.id, userId }).lean() as any
    if (!suite) return NextResponse.json({ error: 'Suite not found' }, { status: 404 })

    if (!suite.inputText?.trim()) {
      return NextResponse.json({ error: 'Original requirement text not available for regeneration' }, { status: 400 })
    }

    const effectiveTypes = (testingTypes && testingTypes.length > 0)
      ? testingTypes
      : (suite.testingTypes?.length > 0 ? suite.testingTypes : ['Functional'])

    const result = await generateTestCases({
      inputType: suite.inputType ?? 'user_story',
      priority: suite.priority ?? 'medium',
      testingTypes: effectiveTypes,
      userStory: suite.inputText,
      model: 'auto',
    })

    let finalCases: TestCase[] = result.testCases

    if (mode === 'merge') {
      const existing: TestCase[] = suite.testCases ?? []
      const existingTitles = new Set(existing.map((tc: TestCase) => tc.title.toLowerCase().trim()))
      const novel = result.testCases.filter(tc => !existingTitles.has(tc.title.toLowerCase().trim()))
      // Re-number IDs across the merged list
      finalCases = [...existing, ...novel].map((tc, i) => ({
        ...tc,
        id: `TC-${String(i + 1).padStart(3, '0')}`,
      }))
    }

    return NextResponse.json({
      testCases: finalCases,
      modelUsed: result.modelUsed,
      generationTime: result.generationTime,
      addedCount: mode === 'merge'
        ? finalCases.length - (suite.testCases?.length ?? 0)
        : finalCases.length,
    })
  } catch (err) {
    console.error('[POST /api/suites/[id]/regenerate]', err)
    return NextResponse.json({ error: 'Regeneration failed' }, { status: 503 })
  }
}
