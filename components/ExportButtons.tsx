'use client'

import { TestCase } from '@/lib/ai-router'

interface ExportButtonsProps {
  testCases: TestCase[]
  suiteTitle: string
}

function exportToExcel(testCases: TestCase[], title: string) {
  import('xlsx').then((XLSX) => {
    const rows = testCases.map((tc) => ({
      ID: tc.id, Title: tc.title, Category: tc.category, Priority: tc.priority,
      Preconditions: tc.preconditions, Steps: tc.steps.join('\n'),
      'Expected Result': tc.expectedResult, Status: tc.status, Notes: tc.notes,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Test Cases')
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_test_cases.xlsx`)
  })
}

function exportToPDF(testCases: TestCase[], title: string) {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(20); doc.setTextColor(59, 130, 246)
      doc.text('AI Test Copilot', 14, 18)
      doc.setFontSize(12); doc.setTextColor(30, 30, 46)
      doc.text(`Test Suite: ${title}`, 14, 28)
      doc.setFontSize(9); doc.setTextColor(100, 100, 120)
      doc.text(`Generated: ${new Date().toLocaleDateString()}  ·  ${testCases.length} test cases`, 14, 35)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(doc as any).autoTable({
        startY: 40,
        head: [['ID', 'Title', 'Category', 'Priority', 'Expected Result', 'Status']],
        body: testCases.map((tc) => [tc.id, tc.title, tc.category, tc.priority, tc.expectedResult, tc.status]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 60 } },
      })
      doc.save(`${title.replace(/\s+/g, '_')}_test_cases.pdf`)
    })
  })
}

function copyAsMarkdown(testCases: TestCase[], title: string) {
  const header = `# ${title}\n\n| ID | Title | Category | Priority | Status |\n|---|---|---|---|---|\n`
  const rows = testCases.map((tc) => `| ${tc.id} | ${tc.title} | ${tc.category} | ${tc.priority} | ${tc.status} |`).join('\n')
  navigator.clipboard.writeText(header + rows).then(() => {
    // toast handled by caller if needed
  })
}

const btnStyle = {
  base: 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
}

export default function ExportButtons({ testCases, suiteTitle }: ExportButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => exportToExcel(testCases, suiteTitle)}
        className={btnStyle.base}
        style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.2)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>
      <button
        onClick={() => exportToPDF(testCases, suiteTitle)}
        className={btnStyle.base}
        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        PDF
      </button>
      <button
        onClick={() => copyAsMarkdown(testCases, suiteTitle)}
        className={btnStyle.base}
        style={{ background: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.15)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.08)' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Markdown
      </button>
    </div>
  )
}
