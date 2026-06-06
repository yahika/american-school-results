import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'as-admin-token'
const EXPIRY = '8h'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env variable is not set')
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: { adminId: number; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { adminId: number; username: string }
  } catch {
    return null
  }
}

/** Called from Server Components / Route Handlers */
export async function getAdminFromCookies() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

/** Called from middleware (uses request directly) */
export async function getAdminFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function setCookieHeader(token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax${isProduction ? '; Secure' : ''}`
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}

/** Grade percentage → letter grade */
export function calcLetterGrade(pct: number): string {
  if (pct >= 97) return 'A+'
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 60) return 'D'
  if (pct >= 50) return 'E'
  return 'F'
}

/** Compute result totals from raw subject scores */
export function computeResultStats(subjects: { score: number; maxScore: number }[]) {
  const totalScore = subjects.reduce((s, sub) => s + sub.score, 0)
  const maxScore = subjects.reduce((s, sub) => s + sub.maxScore, 0)
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0
  const failCount = subjects.filter(s => s.score < s.maxScore * 0.5).length
  const status = percentage >= 50 && failCount <= 2 ? 'pass' : 'fail'
  const letterGrade = calcLetterGrade(percentage)
  return { totalScore, maxScore, percentage, status, letterGrade }
}
