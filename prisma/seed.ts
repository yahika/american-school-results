import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Grade calculation helpers ───────────────────────────────────────────────
function calcLetterGrade(pct: number): string {
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

function buildResult(data: {
  seatNumber: string
  nameAr: string
  nameEn: string
  gradeAr: string
  gradeEn: string
  dateOfBirth: string
  scores: { nameAr: string; nameEn: string; score: number; maxScore?: number }[]
}) {
  const subjects = data.scores.map((s, idx) => {
    const max = s.maxScore ?? 100
    const pass = s.score >= max * 0.5
    return { nameAr: s.nameAr, nameEn: s.nameEn, score: s.score, maxScore: max, passMark: max * 0.5, status: pass ? 'pass' : 'fail', orderIdx: idx }
  })
  const totalScore = subjects.reduce((sum, s) => sum + s.score, 0)
  const maxScore = subjects.reduce((sum, s) => sum + s.maxScore, 0)
  const percentage = Math.round((totalScore / maxScore) * 1000) / 10
  const failCount = subjects.filter(s => s.status === 'fail').length
  // Pass = overall >= 50% AND not failing more than 2 subjects
  const status = percentage >= 50 && failCount <= 2 ? 'pass' : 'fail'
  const letterGrade = calcLetterGrade(percentage)
  return { ...data, subjects, totalScore, maxScore, percentage, status, letterGrade }
}

// ─── Sample students ──────────────────────────────────────────────────────────
const SUBJECTS_TERM1 = [
  { nameAr: 'اللغة العربية', nameEn: 'Arabic Language' },
  { nameAr: 'الرياضيات', nameEn: 'Mathematics' },
  { nameAr: 'العلوم', nameEn: 'Sciences' },
  { nameAr: 'اللغة الإنجليزية', nameEn: 'English Language' },
  { nameAr: 'التربية الإسلامية', nameEn: 'Islamic Studies' },
  { nameAr: 'الدراسات الاجتماعية', nameEn: 'Social Studies' },
  { nameAr: 'الحاسوب', nameEn: 'Computer Science' },
]

const students = [
  {
    seatNumber: '1001', nameAr: 'أحمد محمد حسن', nameEn: 'Ahmed Mohamed Hassan',
    gradeAr: 'الصف العاشر', gradeEn: 'Grade 10', dateOfBirth: '2007-05-15',
    scores1: [85, 78, 90, 88, 95, 82, 75],
    scores2: [88, 80, 91, 90, 96, 85, 79],
  },
  {
    seatNumber: '1002', nameAr: 'سارة أحمد المصري', nameEn: 'Sara Ahmed Al-Masri',
    gradeAr: 'الصف العاشر', gradeEn: 'Grade 10', dateOfBirth: '2007-09-23',
    scores1: [72, 65, 68, 75, 80, 71, 69],
    scores2: [74, 68, 70, 77, 82, 73, 71],
  },
  {
    seatNumber: '1003', nameAr: 'محمد خالد الرشيدي', nameEn: 'Mohammed Khaled Al-Rashidi',
    gradeAr: 'الصف الحادي عشر', gradeEn: 'Grade 11', dateOfBirth: '2006-03-10',
    scores1: [45, 38, 55, 50, 60, 42, 48],  // Fail scenario
    scores2: [52, 50, 58, 55, 65, 50, 52],  // Just passing second term
  },
  {
    seatNumber: '1004', nameAr: 'فاطمة علي الزهراني', nameEn: 'Fatima Ali Al-Zahrani',
    gradeAr: 'الصف التاسع', gradeEn: 'Grade 9', dateOfBirth: '2008-01-07',
    scores1: [95, 92, 88, 96, 98, 91, 94],
    scores2: [97, 95, 90, 98, 99, 93, 96],
  },
  {
    seatNumber: '1005', nameAr: 'عمر يوسف الخالدي', nameEn: 'Omar Youssef Al-Khalidi',
    gradeAr: 'الصف الثاني عشر', gradeEn: 'Grade 12', dateOfBirth: '2005-11-30',
    scores1: [60, 55, 62, 58, 70, 65, 61],
    scores2: [63, 58, 65, 62, 73, 67, 64],
  },
  {
    seatNumber: '1006', nameAr: 'نورة عبدالله السالم', nameEn: 'Noura Abdullah Al-Salem',
    gradeAr: 'الصف الثامن', gradeEn: 'Grade 8', dateOfBirth: '2009-06-18',
    scores1: [88, 91, 85, 92, 90, 87, 89],
    scores2: [90, 93, 87, 94, 92, 89, 91],
  },
]

async function main() {
  console.log('🌱 Seeding database...\n')

  // ── Create admin account ────────────────────────────────────────────────────
  const hashedPw = await bcrypt.hash('Admin@2024!', 12)
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashedPw },
  })
  console.log(`✅ Admin created: username="${admin.username}", password="Admin@2024!"`)
  console.log('   ⚠️  Change this password after first login!\n')

  // ── Semester 1 — First Term 2024-2025 ──────────────────────────────────────
  const sem1 = await prisma.semester.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nameAr: 'الفصل الدراسي الأول 2024-2025',
      nameEn: 'First Semester 2024-2025',
      academicYear: '2024-2025',
      term: 'first',
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  for (const s of students) {
    const r = buildResult({
      seatNumber: s.seatNumber,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      gradeAr: s.gradeAr,
      gradeEn: s.gradeEn,
      dateOfBirth: s.dateOfBirth,
      scores: SUBJECTS_TERM1.map((sub, i) => ({ ...sub, score: s.scores1[i] })),
    })
    await prisma.result.upsert({
      where: { semesterId_seatNumber: { semesterId: sem1.id, seatNumber: s.seatNumber } },
      update: {},
      create: {
        semesterId: sem1.id,
        seatNumber: r.seatNumber,
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        gradeAr: r.gradeAr,
        gradeEn: r.gradeEn,
        dateOfBirth: r.dateOfBirth,
        totalScore: r.totalScore,
        maxScore: r.maxScore,
        percentage: r.percentage,
        status: r.status,
        letterGrade: r.letterGrade,
        subjects: { create: r.subjects },
      },
    })
  }
  console.log(`✅ Semester 1 seeded: "${sem1.nameEn}" — ${students.length} students`)

  // ── Semester 2 — Second Term 2024-2025 ─────────────────────────────────────
  const sem2 = await prisma.semester.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nameAr: 'الفصل الدراسي الثاني 2024-2025',
      nameEn: 'Second Semester 2024-2025',
      academicYear: '2024-2025',
      term: 'second',
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  for (const s of students) {
    const r = buildResult({
      seatNumber: s.seatNumber,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      gradeAr: s.gradeAr,
      gradeEn: s.gradeEn,
      dateOfBirth: s.dateOfBirth,
      scores: SUBJECTS_TERM1.map((sub, i) => ({ ...sub, score: s.scores2[i] })),
    })
    await prisma.result.upsert({
      where: { semesterId_seatNumber: { semesterId: sem2.id, seatNumber: s.seatNumber } },
      update: {},
      create: {
        semesterId: sem2.id,
        seatNumber: r.seatNumber,
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        gradeAr: r.gradeAr,
        gradeEn: r.gradeEn,
        dateOfBirth: r.dateOfBirth,
        totalScore: r.totalScore,
        maxScore: r.maxScore,
        percentage: r.percentage,
        status: r.status,
        letterGrade: r.letterGrade,
        subjects: { create: r.subjects },
      },
    })
  }
  console.log(`✅ Semester 2 seeded: "${sem2.nameEn}" — ${students.length} students`)

  console.log('\n🎉 Seed complete!\n')
  console.log('📋 Test credentials:')
  console.log('   Admin login → username: admin | password: Admin@2024!')
  console.log('\n📋 Test student seat numbers:')
  students.forEach(s => {
    console.log(`   ${s.seatNumber} → ${s.nameAr} | DOB: ${s.dateOfBirth}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
