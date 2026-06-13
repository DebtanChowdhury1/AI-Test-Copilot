import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import { computeHealthScore } from '@/lib/health-score'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const suites = await TestSuite.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $project: { title: 1, inputType: 1, priority: 1, aiModel: 1, testingTypes: 1, createdAt: 1, updatedAt: 1, healthScore: 1, testCaseCount: { $size: '$testCases' } } },
    ])
    return NextResponse.json(suites)
  } catch (err) {
    console.error('[GET /api/suites]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { score } = computeHealthScore(body.testCases ?? [])
    await connectDB()
    const suite = await TestSuite.create({ ...body, userId, healthScore: score })
    revalidatePath('/dashboard')
    revalidatePath('/suites')
    return NextResponse.json(suite, { status: 201 })
  } catch (err) {
    console.error('[POST /api/suites]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
