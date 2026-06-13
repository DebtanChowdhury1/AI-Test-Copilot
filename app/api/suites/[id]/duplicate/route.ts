import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'

interface Params {
  params: { id: string }
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const original = await TestSuite.findOne({ _id: params.id, userId }).lean() as Record<string, unknown> | null
  if (!original) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Strip immutable fields before creating the copy
  const { _id, createdAt, updatedAt, __v, ...rest } = original

  const copy = await TestSuite.create({
    ...rest,
    title: `Copy of ${rest.title}`,
    userId,
  })

  return NextResponse.json(copy, { status: 201 })
}
