/**
 * WhatsApp notification service using UltraMsg API
 *
 * Setup:
 *  1. Go to https://ultramsg.com — create a free trial account
 *  2. Create an instance and connect your WhatsApp phone
 *  3. Copy your Instance ID and Token
 *  4. Add to .env:
 *       ULTRAMSG_INSTANCE=instance12345
 *       ULTRAMSG_TOKEN=your_token_here
 *
 * Messages are sent automatically when admin publishes results.
 */

export interface WhatsAppResult {
  phone: string
  sent: boolean
  error?: string
}

/** Normalize Egyptian/international phone numbers to WhatsApp format */
function normalizePhone(raw: string): string {
  // Remove spaces, dashes, parentheses
  let phone = raw.replace(/[\s\-().]/g, '')

  // Egyptian local format: 01xxxxxxxxx → +201xxxxxxxxx
  if (/^01[0-9]{9}$/.test(phone)) {
    phone = '+2' + phone
  }

  // Already has country code without +
  if (/^201[0-9]{9}$/.test(phone)) {
    phone = '+' + phone
  }

  // If doesn't start with +, assume Egyptian
  if (!phone.startsWith('+')) {
    phone = '+' + phone
  }

  return phone
}

/** Build the Arabic WhatsApp message sent to a parent */
export function buildResultMessage({
  studentName,
  semesterName,
  totalScore,
  maxScore,
  percentage,
  status,
  letterGrade,
  schoolName = 'أكاديمية النخبة بالإسكندرية',
}: {
  studentName: string
  semesterName: string
  totalScore: number
  maxScore: number
  percentage: number
  status: string
  letterGrade?: string | null
  schoolName?: string
}): string {
  const isPass = status === 'pass'
  const statusText = isPass ? '✅ ناجح' : '❌ راسب'
  const gradeText = letterGrade ? ` | التقدير: ${letterGrade}` : ''

  return [
    `📢 *${schoolName}*`,
    ``,
    `عزيزي ولي أمر الطالب/ة *${studentName}*`,
    ``,
    `تم نشر نتيجة *${semesterName}*`,
    ``,
    `📊 المجموع: *${totalScore}/${maxScore}*`,
    `📈 النسبة: *${percentage}%*${gradeText}`,
    `🏆 الحكم: ${statusText}`,
    ``,
    `يمكن الاطلاع على التفاصيل الكاملة عبر بوابة النتائج.`,
  ].join('\n')
}

/** Send a single WhatsApp message via UltraMsg */
async function sendOne(phone: string, message: string): Promise<WhatsAppResult> {
  const instanceId = process.env.ULTRAMSG_INSTANCE
  const token = process.env.ULTRAMSG_TOKEN

  if (!instanceId || !token) {
    return { phone, sent: false, error: 'ULTRAMSG_INSTANCE or ULTRAMSG_TOKEN not set in .env' }
  }

  const normalized = normalizePhone(phone)

  try {
    const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token,
        to: normalized,
        body: message,
        priority: '1',
      }),
    })

    const data = await res.json()

    if (data.sent === 'true' || data.sent === true) {
      return { phone: normalized, sent: true }
    }
    return { phone: normalized, sent: false, error: data.error ?? JSON.stringify(data) }
  } catch (err) {
    return { phone: normalized, sent: false, error: String(err) }
  }
}

/** Send WhatsApp result notifications to all parents in a semester */
export async function sendResultNotifications(results: {
  nameAr: string
  parentPhone: string | null
  totalScore: number
  maxScore: number
  percentage: number
  status: string
  letterGrade: string | null
  semester: { nameAr: string }
}[]): Promise<{ sent: number; failed: number; skipped: number; details: WhatsAppResult[] }> {
  const details: WhatsAppResult[] = []
  let sent = 0, failed = 0, skipped = 0

  for (const r of results) {
    if (!r.parentPhone?.trim()) {
      skipped++
      continue
    }

    const message = buildResultMessage({
      studentName: r.nameAr,
      semesterName: r.semester.nameAr,
      totalScore: r.totalScore,
      maxScore: r.maxScore,
      percentage: r.percentage,
      status: r.status,
      letterGrade: r.letterGrade,
    })

    const result = await sendOne(r.parentPhone, message)
    details.push(result)

    if (result.sent) sent++
    else failed++

    // Small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  return { sent, failed, skipped, details }
}
