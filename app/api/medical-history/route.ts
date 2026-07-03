import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { medicalHistory } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return Response.json([]) // Return empty history instead of 401
    }

    const history = await db
      .select()
      .from(medicalHistory)
      .where(eq(medicalHistory.userId, session.user.id))
      .orderBy(desc(medicalHistory.createdAt))
      .limit(50)

    return Response.json(history)
  } catch (error) {
    console.error('[medical-history]', error)
    return Response.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
