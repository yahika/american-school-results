/**
 * Interactive script to create or update the admin account.
 * Run with:  npm run setup:admin
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createInterface } from 'readline'

const prisma = new PrismaClient()

function question(rl: ReturnType<typeof createInterface>, prompt: string): Promise<string> {
  return new Promise(resolve => rl.question(prompt, resolve))
}

async function main() {
  console.log('\n🔐 American School Results — Admin Setup\n')

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const username = (await question(rl, 'Enter admin username [admin]: ')).trim() || 'admin'
  const password = (await question(rl, 'Enter admin password: ')).trim()

  if (!password || password.length < 6) {
    console.error('❌ Password must be at least 6 characters.')
    rl.close(); process.exit(1)
  }

  rl.close()

  const hashedPw = await bcrypt.hash(password, 12)

  const existing = await prisma.admin.findUnique({ where: { username } })
  if (existing) {
    await prisma.admin.update({ where: { username }, data: { password: hashedPw } })
    console.log(`\n✅ Admin "${username}" password updated.`)
  } else {
    await prisma.admin.create({ data: { username, password: hashedPw } })
    console.log(`\n✅ Admin account created: "${username}"`)
  }

  console.log('   You can now log in at /admin/login\n')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
