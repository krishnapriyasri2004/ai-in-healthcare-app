'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { medicalHistory } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { eq, desc } from 'drizzle-orm'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getMedicalHistory() {
  const userId = await getUserId()
  return db
    .select()
    .from(medicalHistory)
    .where(eq(medicalHistory.userId, userId))
    .orderBy(desc(medicalHistory.createdAt))
    .limit(50)
}

export async function deleteMedicalRecord(recordId: string) {
  const userId = await getUserId()
  await db
    .delete(medicalHistory)
    .where(eq(medicalHistory.id, recordId))
    .where(eq(medicalHistory.userId, userId))
}
