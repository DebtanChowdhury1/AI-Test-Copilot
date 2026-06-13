export interface HealthBreakdown {
  coverage: number      // category diversity (positive/negative/edge_case)
  quality: number       // step completeness + expected result detail
  volume: number        // sweet-spot case count
  distribution: number  // priority variety
  negativeTesting: number
  edgeTesting: number
}

export interface HealthScore {
  score: number
  grade: string
  color: string
  bgColor: string
  borderColor: string
  label: string
  breakdown: HealthBreakdown
}

interface MinimalTestCase {
  category: string
  priority: string
  steps: string[]
  expectedResult: string
  preconditions?: string
}

export function computeHealthScore(testCases: MinimalTestCase[]): HealthScore {
  if (!testCases || testCases.length === 0) {
    return { score: 0, grade: 'F', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', label: 'No Tests', breakdown: { coverage: 0, quality: 0, volume: 0, distribution: 0, negativeTesting: 0, edgeTesting: 0 } }
  }

  const n = testCases.length

  // 1. Category diversity (0–25 pts) — has all 3 categories
  const cats = new Set(testCases.map(t => t.category))
  const coverage = Math.round((cats.size / 3) * 25)

  // 2. Step + result quality (0–25 pts) — avg 3 filled steps + detailed expectedResult
  const qualCount = testCases.filter(t => {
    const filledSteps = t.steps.filter(s => s.trim().length > 5).length
    return filledSteps >= 3 && t.expectedResult.trim().length > 25
  }).length
  const quality = Math.round((qualCount / n) * 25)

  // 3. Volume sweet-spot (0–15 pts)
  const volume = n >= 10 && n <= 30 ? 15 : n >= 6 ? 10 : n >= 3 ? 5 : 2

  // 4. Priority distribution (0–15 pts) — not all the same priority
  const pris = new Set(testCases.map(t => t.priority))
  const distribution = Math.round((pris.size / 4) * 15)

  // 5. Has negative tests (0–10 pts)
  const negativeTesting = testCases.some(t => t.category === 'negative') ? 10 : 0

  // 6. Has edge cases (0–10 pts)
  const edgeTesting = testCases.some(t => t.category === 'edge_case') ? 10 : 0

  const score = Math.min(100, coverage + quality + volume + distribution + negativeTesting + edgeTesting)

  const { grade, color, bgColor, borderColor, label } =
    score >= 92 ? { grade: 'A+', color: '#10b981', bgColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', label: 'Excellent' } :
    score >= 82 ? { grade: 'A',  color: '#10b981', bgColor: 'rgba(16,185,129,0.1)',  borderColor: 'rgba(16,185,129,0.25)', label: 'Very Good' } :
    score >= 72 ? { grade: 'B+', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)',  borderColor: 'rgba(59,130,246,0.25)', label: 'Good' } :
    score >= 62 ? { grade: 'B',  color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)',  borderColor: 'rgba(59,130,246,0.2)',  label: 'Decent' } :
    score >= 50 ? { grade: 'C+', color: '#eab308', bgColor: 'rgba(234,179,8,0.1)',   borderColor: 'rgba(234,179,8,0.25)', label: 'Fair' } :
    score >= 38 ? { grade: 'C',  color: '#f97316', bgColor: 'rgba(249,115,22,0.1)',  borderColor: 'rgba(249,115,22,0.25)', label: 'Needs Work' } :
    score >= 22 ? { grade: 'D',  color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)',   borderColor: 'rgba(239,68,68,0.25)', label: 'Poor' } :
                  { grade: 'F',  color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)',  borderColor: 'rgba(239,68,68,0.3)',  label: 'Critical' }

  return { score, grade, color, bgColor, borderColor, label, breakdown: { coverage, quality, volume, distribution, negativeTesting, edgeTesting } }
}
