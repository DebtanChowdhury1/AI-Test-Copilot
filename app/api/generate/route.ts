import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTestCases, GenerationInput } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { inputType, priority, testingTypes, userStory, model } = body

  if (!userStory || !inputType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const input: GenerationInput = {
    inputType: inputType ?? 'user_story',
    priority: priority ?? 'medium',
    testingTypes: testingTypes ?? ['functional'],
    userStory,
    model: model ?? 'auto',
  }

  try {
    const result = await generateTestCases(input)
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test cases. Both AI providers failed.' },
      { status: 503 }
    )
  }
}
