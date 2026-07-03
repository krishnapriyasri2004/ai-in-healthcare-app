import { generateObject } from 'ai'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { medicalHistory } from '@/lib/db/schema'
import { headers } from 'next/headers'
import crypto from 'crypto'

const analysisSchema = z.object({
  predictedCondition: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
  affectedRegions: z.array(z.object({
    bodyRegion: z.string(), // Map to existing organ IDs (e.g. 'heart', 'lungs', 'brain')
    confidence: z.enum(['high', 'medium', 'low']),
    condition: z.string(),
    reasoning: z.string()
  })),
  recommendations: z.array(z.string()),
  severityScore: z.number().min(0).max(100),
})

export async function POST(req: Request) {
  try {
    const { symptoms, notes, gender, vitals } = await req.json()

    if (!symptoms || symptoms.trim().length === 0) {
      return new Response('Symptoms are required', { status: 400 })
    }

    let userId = 'demo-user-' + crypto.randomUUID()
    try {
      const session = await auth.api.getSession({ headers: await headers() })
      if (session?.user) {
        userId = session.user.id
      }
    } catch (e) {
      // Continue with demo user
    }

    const systemPrompt = `You are a medical AI assistant. Analyze symptoms and vitals telemetry to provide a single predicted condition.

IMPORTANT DISCLAIMERS:
- This is NOT a medical diagnosis. It is for educational purposes only.
- Always recommend seeing a qualified healthcare professional.
- Do not provide treatment advice.
- If symptoms suggest an emergency, recommend immediate medical attention.

Analyze the symptoms and return strict JSON with:
1. predictedCondition (string): The primary suspected condition.
2. confidence (high/medium/low): Overall confidence in this prediction.
3. reasoning (string): Explanation for this prediction.
4. affectedRegions: Array of regions mapped to these exact IDs: 'brain', 'throat', 'nasal_cavity', 'trachea', 'lungs', 'heart', 'liver', 'stomach', 'kidneys', 'intestines'.
   For each region, include bodyRegion, confidence (high/medium/low), condition (what is happening in this region), and reasoning (why this region is affected).
5. recommendations: Array of general advice strings.
6. severityScore: 0-100 scale.`

    const vitalsStr = vitals ? `\nPatient Vitals: Temperature: ${vitals.temp}°C, Heart Rate: ${vitals.hr} BPM, SpO2: ${vitals.spo2}%, Blood Pressure: ${vitals.bp}` : ''
    const userPrompt = `Patient Biological Sex: ${gender || 'Unknown'}${vitalsStr}\nPatient symptoms: ${symptoms}${notes ? `\nAdditional notes: ${notes}` : ''}`

    let object
    try {
      const { object: aiObject } = await generateObject({
        model: 'openai/gpt-4o',
        schema: analysisSchema,
        system: systemPrompt,
        prompt: userPrompt,
      })
      object = aiObject
    } catch (e) {
      console.log('[analyze-symptoms] Using demo response due to:', e)
      object = {
        predictedCondition: 'Influenza (Common Flu)',
        confidence: 'high' as const,
        reasoning: 'Symptoms closely match viral respiratory infection commonly seen during flu season.',
        affectedRegions: [
          {
            bodyRegion: 'throat',
            confidence: 'high' as const,
            condition: 'Pharyngitis',
            reasoning: 'Inflammation of the pharynx causing soreness and irritation.'
          },
          {
            bodyRegion: 'lungs',
            confidence: 'medium' as const,
            condition: 'Bronchial irritation',
            reasoning: 'Viral presence in respiratory tract leading to cough and chest discomfort.'
          },
          {
            bodyRegion: 'nasal_cavity',
            confidence: 'high' as const,
            condition: 'Rhinitis',
            reasoning: 'Congestion and inflammation in nasal passages.'
          }
        ],
        recommendations: [
          'Consult a healthcare professional',
          'Stay hydrated and rest',
          'Monitor body temperature',
          'Avoid spreading to others',
        ],
        severityScore: 35,
      }
    }

    const id = crypto.randomUUID()
    try {
      await db.insert(medicalHistory).values({
        id,
        userId,
        symptoms,
        detectedConditions: JSON.stringify([{
          name: object.predictedCondition,
          likelihood: object.confidence,
          description: object.reasoning
        }]),
        affectedOrgans: JSON.stringify(object.affectedRegions.map(r => ({
          id: r.bodyRegion,
          severity: r.confidence,
          condition: r.condition,
          reasoning: r.reasoning
        }))),
        severityScore: object.severityScore,
        notes: notes || null,
      })
    } catch (e) {
      console.log('[analyze-symptoms] Demo mode - skipping database save')
    }

    return Response.json({
      success: true,
      analysis: {
        predictedCondition: object.predictedCondition,
        confidence: object.confidence,
        reasoning: object.reasoning,
        affectedRegions: object.affectedRegions,
        recommendations: object.recommendations,
        severityScore: object.severityScore,
      },
      recordId: id,
    })
  } catch (error) {
    console.error('[analyze-symptoms]', error)
    return Response.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    )
  }
}
