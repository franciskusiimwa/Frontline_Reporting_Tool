import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Submission } from './types'

type PdfFonts = {
  regular: Awaited<ReturnType<PDFDocument['embedFont']>>
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>
}

type PdfCursor = {
  page: Awaited<ReturnType<PDFDocument['addPage']>>
  y: number
}

const PAGE_SIZE: [number, number] = [595, 842]
const PAGE_MARGIN = 44

function normalize(value: unknown, fallback = 'Not provided'): string {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  return text.length > 0 ? text : fallback
}

function wrapText(text: string, maxChars = 90): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = words[0]
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`
    if (next.length <= maxChars) {
      current = next
    } else {
      lines.push(current)
      current = words[i]
    }
  }
  lines.push(current)
  return lines
}

function safePercent(value: unknown): string {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num)) return '0.0%'
  return `${num.toFixed(1)}%`
}

function ensureRoom(pdfDoc: PDFDocument, cursor: PdfCursor, fonts: PdfFonts, needed = 24): PdfCursor {
  if (cursor.y >= PAGE_MARGIN + needed) return cursor
  const newPage = pdfDoc.addPage(PAGE_SIZE)
  return { page: newPage, y: PAGE_SIZE[1] - PAGE_MARGIN }
}

function drawLine(pdfDoc: PDFDocument, cursor: PdfCursor, fonts: PdfFonts, text: string, opts?: { bold?: boolean; size?: number; color?: [number, number, number] }): PdfCursor {
  const size = opts?.size ?? 10
  const color = opts?.color ?? [0.15, 0.18, 0.22]
  const next = ensureRoom(pdfDoc, cursor, fonts, size + 8)
  next.page.drawText(text, {
    x: PAGE_MARGIN,
    y: next.y,
    size,
    font: opts?.bold ? fonts.bold : fonts.regular,
    color: rgb(color[0], color[1], color[2]),
  })
  next.y -= size + 6
  return next
}

function drawWrapped(pdfDoc: PDFDocument, cursor: PdfCursor, fonts: PdfFonts, text: string, opts?: { bold?: boolean; size?: number; color?: [number, number, number] }): PdfCursor {
  let current = cursor
  for (const line of wrapText(text)) {
    current = drawLine(pdfDoc, current, fonts, line, opts)
  }
  return current
}

function drawSection(pdfDoc: PDFDocument, cursor: PdfCursor, fonts: PdfFonts, title: string): PdfCursor {
  let current = ensureRoom(pdfDoc, cursor, fonts, 30)
  current = drawLine(pdfDoc, current, fonts, title, { bold: true, size: 12, color: [0.04, 0.27, 0.45] })
  current = drawLine(pdfDoc, current, fonts, '', { size: 2 })
  return current
}

function drawSubmissionReport(pdfDoc: PDFDocument, fonts: PdfFonts, submission: Submission, includePageBreak = false): void {
  if (includePageBreak || pdfDoc.getPageCount() === 0) {
    pdfDoc.addPage(PAGE_SIZE)
  }
  const startPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1]
  let cursor: PdfCursor = { page: startPage, y: PAGE_SIZE[1] - PAGE_MARGIN }

  const data = submission.data ?? {}
  const author = normalize(submission.profile?.full_name ?? data.po_names)
  const priorities = Array.isArray(data.next_week_priorities) ? data.next_week_priorities.slice(0, 3) : []

  cursor = drawLine(pdfDoc, cursor, fonts, 'EXP Weekly Regional Report', { bold: true, size: 18, color: [0.02, 0.25, 0.41] })
  cursor = drawLine(pdfDoc, cursor, fonts, `${normalize(submission.region)} | ${normalize(submission.week_label)}`, { size: 11, color: [0.3, 0.34, 0.4] })
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Report Details')
  cursor = drawLine(pdfDoc, cursor, fonts, `Submitted by: ${author}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Submission status: ${normalize(submission.status).replace('_', ' ')}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Overall status: ${normalize(data.overall_status).replace('_', ' ')}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Submitted at: ${normalize(submission.submitted_at ?? submission.updated_at)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Weekly Snapshot')
  cursor = drawWrapped(pdfDoc, cursor, fonts, `Top win: ${normalize(data.top_win)}`)
  cursor = drawWrapped(pdfDoc, cursor, fonts, `Top challenge: ${normalize(data.top_challenge)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Confidence for next week: ${normalize(data.confidence_next_week)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Core Metrics')
  cursor = drawLine(pdfDoc, cursor, fonts, `Scholar baseline (term start): ${Number(data.scholar_retention?.baseline_scholars ?? 0)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Scholar retention: ${safePercent(data.scholar_retention?.retention_rate)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Mentor retention: ${safePercent(data.mentor_retention?.retention_rate)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Passbook scholars reached: ${Number(data.passbook_conversations?.scholars_reached ?? 0)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Passbook reach percentage: ${safePercent(data.passbook_conversations?.pct_scholars_reached)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Insights And Next Week Priorities')
  cursor = drawWrapped(pdfDoc, cursor, fonts, `Mentor insights: ${normalize(data.mentor_insights)}`)
  cursor = drawWrapped(pdfDoc, cursor, fonts, `Scholar insights: ${normalize(data.scholar_insights)}`)
  if (priorities.length === 0) {
    cursor = drawLine(pdfDoc, cursor, fonts, 'Next week priorities: Not provided')
  } else {
    cursor = drawLine(pdfDoc, cursor, fonts, 'Next week priorities:')
    for (const priority of priorities) {
      cursor = drawWrapped(pdfDoc, cursor, fonts, `- ${normalize(priority)}`)
    }
  }

  cursor = drawLine(pdfDoc, cursor, fonts, '')
  drawLine(pdfDoc, cursor, fonts, 'Generated by EXP Weekly Regional Update Platform', { size: 9, color: [0.42, 0.45, 0.51] })
}

function drawGroupCoverPage(pdfDoc: PDFDocument, fonts: PdfFonts, submissions: Submission[]): void {
  const page = pdfDoc.addPage(PAGE_SIZE)
  let cursor: PdfCursor = { page, y: PAGE_SIZE[1] - PAGE_MARGIN }

  const regionCounts = new Map<string, number>()
  const weekCounts = new Map<string, number>()
  const statusCounts = new Map<string, number>()
  let scholarRetentionSum = 0
  let scholarRetentionCount = 0
  let scholarRetentionMin = Number.POSITIVE_INFINITY
  let scholarRetentionMax = Number.NEGATIVE_INFINITY
  let mentorRetentionSum = 0
  let mentorRetentionCount = 0
  let mentorRetentionMin = Number.POSITIVE_INFINITY
  let mentorRetentionMax = Number.NEGATIVE_INFINITY
  let passbookReachSum = 0
  let passbookReachCount = 0
  let passbookReachMin = Number.POSITIVE_INFINITY
  let passbookReachMax = Number.NEGATIVE_INFINITY

  const scholarRegionAgg = new Map<string, { sum: number; count: number }>()
  const mentorRegionAgg = new Map<string, { sum: number; count: number }>()
  const passbookRegionAgg = new Map<string, { sum: number; count: number }>()

  const addRegionMetric = (target: Map<string, { sum: number; count: number }>, region: string, value: number) => {
    const current = target.get(region) ?? { sum: 0, count: 0 }
    current.sum += value
    current.count += 1
    target.set(region, current)
  }

  for (const submission of submissions) {
    const region = normalize(submission.region)
    const week = normalize(submission.week_label)
    const status = normalize(submission.status).replace('_', ' ')
    const data = submission.data ?? {}
    const scholarRate = Number(data.scholar_retention?.retention_rate)
    const mentorRate = Number(data.mentor_retention?.retention_rate)
    const passbookRate = Number(data.passbook_conversations?.pct_scholars_reached)

    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1)
    weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1)
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)

    if (Number.isFinite(scholarRate)) {
      scholarRetentionSum += scholarRate
      scholarRetentionCount += 1
      scholarRetentionMin = Math.min(scholarRetentionMin, scholarRate)
      scholarRetentionMax = Math.max(scholarRetentionMax, scholarRate)
      addRegionMetric(scholarRegionAgg, region, scholarRate)
    }
    if (Number.isFinite(mentorRate)) {
      mentorRetentionSum += mentorRate
      mentorRetentionCount += 1
      mentorRetentionMin = Math.min(mentorRetentionMin, mentorRate)
      mentorRetentionMax = Math.max(mentorRetentionMax, mentorRate)
      addRegionMetric(mentorRegionAgg, region, mentorRate)
    }
    if (Number.isFinite(passbookRate)) {
      passbookReachSum += passbookRate
      passbookReachCount += 1
      passbookReachMin = Math.min(passbookReachMin, passbookRate)
      passbookReachMax = Math.max(passbookReachMax, passbookRate)
      addRegionMetric(passbookRegionAgg, region, passbookRate)
    }
  }

  const byCountDesc = (a: [string, number], b: [string, number]) => b[1] - a[1]

  const getTopRegion = (target: Map<string, { sum: number; count: number }>): { region: string; avg: number } | null => {
    let best: { region: string; avg: number } | null = null
    for (const [region, agg] of target.entries()) {
      if (agg.count === 0) continue
      const avg = agg.sum / agg.count
      if (!best || avg > best.avg) {
        best = { region, avg }
      }
    }
    return best
  }

  const formatMin = (value: number) => (Number.isFinite(value) ? safePercent(value) : 'N/A')
  const formatMax = (value: number) => (Number.isFinite(value) ? safePercent(value) : 'N/A')

  const scholarTopRegion = getTopRegion(scholarRegionAgg)
  const mentorTopRegion = getTopRegion(mentorRegionAgg)
  const passbookTopRegion = getTopRegion(passbookRegionAgg)

  cursor = drawLine(pdfDoc, cursor, fonts, 'EXP Group Weekly Report', { bold: true, size: 22, color: [0.02, 0.25, 0.41] })
  cursor = drawLine(pdfDoc, cursor, fonts, 'Portfolio Summary', { bold: true, size: 14, color: [0.18, 0.2, 0.25] })
  cursor = drawLine(pdfDoc, cursor, fonts, `Generated: ${new Date().toLocaleString()}`, { size: 10, color: [0.35, 0.38, 0.45] })
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Coverage Snapshot')
  cursor = drawLine(pdfDoc, cursor, fonts, `Total submissions in this report: ${submissions.length}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Regions represented: ${regionCounts.size}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `Weeks represented: ${weekCounts.size}`)
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'KPI Snapshot (Group Averages)')
  cursor = drawLine(pdfDoc, cursor, fonts, `Scholar retention avg: ${safePercent(scholarRetentionCount > 0 ? scholarRetentionSum / scholarRetentionCount : 0)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `  Min/Max: ${formatMin(scholarRetentionMin)} / ${formatMax(scholarRetentionMax)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `  Records included: ${scholarRetentionCount} of ${submissions.length}`)
  cursor = drawLine(
    pdfDoc,
    cursor,
    fonts,
    `  Top region: ${scholarTopRegion ? `${scholarTopRegion.region} (${safePercent(scholarTopRegion.avg)})` : 'N/A'}`
  )

  cursor = drawLine(pdfDoc, cursor, fonts, `Mentor retention avg: ${safePercent(mentorRetentionCount > 0 ? mentorRetentionSum / mentorRetentionCount : 0)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `  Min/Max: ${formatMin(mentorRetentionMin)} / ${formatMax(mentorRetentionMax)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `  Records included: ${mentorRetentionCount} of ${submissions.length}`)
  cursor = drawLine(
    pdfDoc,
    cursor,
    fonts,
    `  Top region: ${mentorTopRegion ? `${mentorTopRegion.region} (${safePercent(mentorTopRegion.avg)})` : 'N/A'}`
  )

  cursor = drawLine(pdfDoc, cursor, fonts, `Passbook reach avg: ${safePercent(passbookReachCount > 0 ? passbookReachSum / passbookReachCount : 0)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `  Min/Max: ${formatMin(passbookReachMin)} / ${formatMax(passbookReachMax)}`)
  cursor = drawLine(pdfDoc, cursor, fonts, `  Records included: ${passbookReachCount} of ${submissions.length}`)
  cursor = drawLine(
    pdfDoc,
    cursor,
    fonts,
    `  Top region: ${passbookTopRegion ? `${passbookTopRegion.region} (${safePercent(passbookTopRegion.avg)})` : 'N/A'}`
  )
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Submissions By Region')
  for (const [region, count] of Array.from(regionCounts.entries()).sort(byCountDesc)) {
    cursor = drawLine(pdfDoc, cursor, fonts, `- ${region}: ${count}`)
  }
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Submissions By Week')
  for (const [week, count] of Array.from(weekCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    cursor = drawLine(pdfDoc, cursor, fonts, `- ${week}: ${count}`)
  }
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  cursor = drawSection(pdfDoc, cursor, fonts, 'Submissions By Status')
  for (const [status, count] of Array.from(statusCounts.entries()).sort(byCountDesc)) {
    cursor = drawLine(pdfDoc, cursor, fonts, `- ${status}: ${count}`)
  }
  cursor = drawLine(pdfDoc, cursor, fonts, '')

  drawLine(pdfDoc, cursor, fonts, 'The following pages contain individual regional records included in this grouped report.', {
    size: 10,
    color: [0.35, 0.38, 0.45],
  })
}

export async function exportSubmissionToPdf(submission: Submission): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.addPage(PAGE_SIZE)
  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  }

  drawSubmissionReport(pdfDoc, fonts, submission)

  return pdfDoc.save()
}

export async function exportSubmissionsGroupToPdf(submissions: Submission[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  }

  if (submissions.length === 0) {
    const page = pdfDoc.addPage(PAGE_SIZE)
    page.drawText('No submissions available for group export.', {
      x: PAGE_MARGIN,
      y: PAGE_SIZE[1] - PAGE_MARGIN,
      size: 12,
      font: fonts.bold,
      color: rgb(0.2, 0.24, 0.29),
    })
    return pdfDoc.save()
  }

  drawGroupCoverPage(pdfDoc, fonts, submissions)

  for (let i = 0; i < submissions.length; i += 1) {
    drawSubmissionReport(pdfDoc, fonts, submissions[i], true)
  }

  return pdfDoc.save()
}
