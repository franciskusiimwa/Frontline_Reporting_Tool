import Anthropic from '@anthropic-ai/sdk'
import type { Submission } from './types'

const client = new Anthropic()

export function buildSummarizePrompt(submission: Submission): string {
  const d = submission.data
  return `You are an analyst reviewing a weekly program delivery report from Educate! Uganda.

SUBMISSION DETAILS:
Region: ${submission.region}
Week: ${submission.week_label}
Overall Status: ${d.overall_status}
Submitted by: ${submission.profile?.full_name ?? 'Unknown'}

TOP WIN: ${d.top_win}
TOP CHALLENGE: ${d.top_challenge}
CONFIDENCE NEXT WEEK: ${d.confidence_next_week}/5

SCHOLAR RETENTION: ${d.scholar_retention?.this_week} scholars (${d.scholar_retention?.retention_rate?.toFixed(1)}%)
Insight: ${d.scholar_retention?.insight}

MENTOR RETENTION: ${d.mentor_retention?.this_week} mentors (${d.mentor_retention?.retention_rate?.toFixed(1)}%)
Insight: ${d.mentor_retention?.insight}

RISKS:
${(d.risks ?? []).map(r => `- [${r.severity}] ${r.description} | Mitigation: ${r.mitigation}`).join('\n')}

FIELD INSIGHTS:
Mentors: ${d.mentor_insights}
Scholars: ${d.scholar_insights}
FOA/System: ${d.foa_insights}

DECISIONS NEEDED: ${d.decision_required}

WHAT WORKED: ${d.what_worked}
WHAT DIDN'T: ${d.what_didnt}

---

Produce a structured summary for leadership with exactly these sections:

**Executive Summary** (3 sentences max — what happened, key number, overall health)

**Top 3 Wins** (bullet points, concrete and specific)

**Top 3 Risks** (bullet points, include severity and recommended action)

**Decision Required from Leadership** (clear, actionable — only if applicable)

**Recommended Focus for Next Week** (1–2 sentences)

Be direct. Use plain language. No filler phrases.`
}

export async function streamSummary(submission: Submission) {
  return client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildSummarizePrompt(submission) }],
  })
}
