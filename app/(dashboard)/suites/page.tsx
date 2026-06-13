import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import SuitesClient, { Suite } from '@/components/SuitesClient'

export const dynamic = 'force-dynamic'

export default async function SuitesPage() {
  const { userId } = await auth()

  let suites: Suite[] = []
  try {
    await connectDB()
    const raw = await TestSuite.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $project: { title: 1, inputType: 1, priority: 1, aiModel: 1, createdAt: 1, healthScore: 1, testingTypes: 1, testCaseCount: { $size: '$testCases' } } },
    ])
    suites = raw.map(s => ({ ...s, _id: String(s._id), createdAt: String(s.createdAt) }))
  } catch { /* DB unavailable */ }

  return <SuitesClient initialSuites={suites} />
}
