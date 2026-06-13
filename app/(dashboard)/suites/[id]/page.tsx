import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import SuiteDetailClient, { SuiteData } from '@/components/SuiteDetailClient'

export const dynamic = 'force-dynamic'

export default async function SuitePage({ params }: { params: { id: string } }) {
  const { userId } = await auth()

  let suite: SuiteData | null = null
  try {
    await connectDB()
    const raw = await TestSuite.findOne({ _id: params.id, userId }).lean()
    if (!raw) notFound()
    suite = {
      _id: String((raw as any)._id),
      title: (raw as any).title,
      inputType: (raw as any).inputType ?? '',
      priority: (raw as any).priority ?? 'medium',
      aiModel: (raw as any).aiModel ?? '',
      testingTypes: (raw as any).testingTypes ?? [],
      testCases: (raw as any).testCases ?? [],
      createdAt: String((raw as any).createdAt),
    }
  } catch {
    notFound()
  }

  if (!suite) notFound()
  return <SuiteDetailClient initialSuite={suite} />
}
