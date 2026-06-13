import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import { computeHealthScore } from '@/lib/health-score'

interface Params { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const suite = await TestSuite.findOne({ _id: params.id, userId }).lean()
    if (!suite) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(suite)
  } catch (err) {
    console.error('[GET /api/suites/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const updatePayload: Record<string, unknown> = { ...body }

    // Recompute health score whenever test cases are updated
    if (body.testCases) {
      const { score } = computeHealthScore(body.testCases)
      updatePayload.healthScore = score
    }

    await connectDB()
    const suite = await TestSuite.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: updatePayload },
      { new: true, runValidators: false }
    )
    if (!suite) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    revalidatePath('/dashboard')
    revalidatePath('/suites')
    revalidatePath(`/suites/${params.id}`)
    return NextResponse.json(suite)
  } catch (err) {
    console.error('[PUT /api/suites/[id]]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const suite = await TestSuite.findOneAndDelete({ _id: params.id, userId })
    if (!suite) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    revalidatePath('/dashboard')
    revalidatePath('/suites')
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/suites/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
