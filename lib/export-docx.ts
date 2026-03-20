import { Document, HeadingLevel, Packer, Paragraph } from 'docx'
import { format } from 'date-fns'
import type { Submission } from './types'

function trafficLightLabel(status: string) {
  switch (status) {
    case 'on_track':
      return '🟢 On Track'
    case 'at_risk':
      return '🟡 At Risk'
    case 'off_track':
      return '🔴 Off Track'
    default:
      return String(status)
  }
}

export async function exportSubmissionToDocx(submission: Submission): Promise<Buffer> {
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial' } } } },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: 'portrait', width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {},
        footers: {},
        children: [
          new Paragraph({ text: 'EXP Weekly Regional Update', heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Region: ${submission.region}`, spacing: { after: 200 } }),
          new Paragraph({ text: `Week: ${submission.week_label}`, spacing: { after: 200 } }),
          new Paragraph({ text: `PO Names: ${submission.profile?.full_name ?? 'Unknown'}`, spacing: { after: 200 } }),
          new Paragraph({ text: `Submission date: ${submission.submitted_at ? format(new Date(submission.submitted_at), 'yyyy-MM-dd') : ''}`, spacing: { after: 200 } }),
          new Paragraph({ text: `Status: ${trafficLightLabel(submission.data.overall_status ?? 'draft')}` }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
