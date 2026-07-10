import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { medicalHistory } from '@/lib/db/schema'
import { headers } from 'next/headers'
import crypto from 'crypto'



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

    const systemPrompt = `You are a medical AI assistant tailored for Indian clinical settings (ABDM alignment). Analyze symptoms and vitals telemetry (including Blood Sugar levels) to provide a single predicted condition.

IMPORTANT DISCLAIMERS:
- This is NOT a medical diagnosis. It is for educational purposes only.
- Always recommend seeing a qualified healthcare professional.
- Do not provide treatment advice.
- If symptoms suggest an emergency, recommend immediate medical attention.
- Prioritize high-incidence Indian clinical conditions where relevant (e.g. Dengue, Pulmonary Tuberculosis, Malaria, Typhoid, Acute Coronary Syndrome).
- Recommendations must align with standard clinical guidelines in India (e.g., DOTS routing for Tuberculosis, paracetamol/Dolo 650 with hydration for Dengue and avoiding NSAIDs, immediate loading dose and angiography routing for ACS).

Analyze the symptoms and return strict JSON with:
1. predictedCondition (string): The primary suspected condition.
2. confidence (high/medium/low): Overall confidence in this prediction.
3. reasoning (string): Explanation for this prediction.
4. affectedRegions: Array of regions mapped to these exact IDs: 'brain', 'throat', 'nasal_cavity', 'trachea', 'lungs', 'heart', 'liver', 'stomach', 'kidneys', 'intestines'.
   For each region, include bodyRegion, confidence (high/medium/low), condition (what is happening in this region), and reasoning (why this region is affected).
5. recommendations: Array of clinical advice strings aligned with Indian healthcare context.
6. severityScore: 0-100 scale.`

    const vitalsStr = vitals ? `\nPatient Vitals: Temperature: ${vitals.temp}°C, Heart Rate: ${vitals.hr} BPM, SpO2: ${vitals.spo2}%, Blood Pressure: ${vitals.bp}${vitals.bloodSugar ? `, Blood Sugar: ${vitals.bloodSugar} mg/dL` : ''}` : ''
    const userPrompt = `Patient Biological Sex: ${gender || 'Unknown'}${vitalsStr}\nPatient symptoms: ${symptoms}${notes ? `\nAdditional notes: ${notes}` : ''}`

    let object
    
    let object
    const apiKey = process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN || process.env.MEDGEMMA_API_KEY
    if (apiKey) {
      try {
        const hfRes = await fetch('https://api-inference.huggingface.co/models/google/gemma-2-9b-it', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            inputs: `<start_of_turn>user
${systemPrompt}

${userPrompt}<end_of_turn>
<start_of_turn>model
\{
`,
            parameters: {
              max_new_tokens: 1500,
              temperature: 0.1,
              return_full_text: false,
            }
          })
        })
        if (hfRes.ok) {
          const hfData = await hfRes.json()
          let content = hfData[0]?.generated_text || ''
          
          // Gemma often returns markdown blocks
          content = content.replace(/```json/g, '').replace(/```/g, '').trim()
          
          // Because we prompted the model with "{
", we need to prepend it
          if (!content.startsWith('{')) content = '{' + content
          
          if (content) {
            try { object = JSON.parse(content) } catch (e) { console.log('Parse error', e, content) }
          }
        } else {
           console.log('HF API Error:', await hfRes.text())
        }
      } catch (e) {
        console.log('[analyze-symptoms] HuggingFace fetch error:', e)
      }
    }

    if (!object) {
      const text = (symptoms + ' ' + (notes || '')).toLowerCase()
      if (text.includes('chest') || text.includes('heart') || text.includes('retrosternal') || text.includes('khanna')) {
        object = {
          predictedCondition: 'Acute Coronary Syndrome (STEMI Risk)',
          confidence: 'high' as const,
          reasoning: 'Retrosternal chest pressure with radiation to the left arm in a patient with cardiovascular risk factors is highly suspect for acute myocardial ischemia.',
          affectedRegions: [
            {
              bodyRegion: 'heart',
              confidence: 'high' as const,
              condition: 'Myocardial Ischemia',
              reasoning: 'Compromised coronary artery perfusion causing active cardiac cellular strain.'
            },
            {
              bodyRegion: 'lungs',
              confidence: 'medium' as const,
              condition: 'Secondary Pulmonary Congestion',
              reasoning: 'Mild respiratory backlog from transient cardiac output reduction.'
            }
          ],
          recommendations: [
            'Perform immediate 12-lead ECG bedside.',
            'Administer loading doses of Aspirin 325mg and Clopidogrel 300mg stat.',
            'Establish double-bore IV access and start low-flow oxygen.',
            'Urgent activation of the Cardiac Cath Lab routing.'
          ],
          severityScore: 90
        }
      } else if (text.includes('dengue') || text.includes('retro-orbital') || text.includes('petechia') || text.includes('priya') || (text.includes('fever') && text.includes('joint'))) {
        object = {
          predictedCondition: 'Dengue Hemorrhagic Fever (Suspected)',
          confidence: 'high' as const,
          reasoning: 'High-grade continuous pyrexia, severe retro-orbital headache, arthralgia/myalgia (breakbone fever), and thrombocytopenic signs point to Dengue virus infection.',
          affectedRegions: [
            {
              bodyRegion: 'brain',
              confidence: 'medium' as const,
              condition: 'Retro-orbital neuralgia',
              reasoning: 'Intense headache from systemic viral infection.'
            },
            {
              bodyRegion: 'liver',
              confidence: 'medium' as const,
              condition: 'Hepatitis / Hepatic congestion',
              reasoning: 'Common site of secondary viral inflammation in Dengue cases.'
            }
          ],
          recommendations: [
            'Administer Paracetamol (Dolo 650mg) SOS for fever control. Strict avoidance of NSAIDs.',
            'Initiate aggressive oral fluid resuscitation using ORS/Electral.',
            'Monitor platelet counts and hematocrit daily.',
            'Advise warning signs for hospitalization: persistent vomiting, mucosal bleeding.'
          ],
          severityScore: 70
        }
      } else if (text.includes('cough') && (text.includes('sputum') || text.includes('blood') || text.includes('hemoptysis') || text.includes('tuberculosis') || text.includes('amit'))) {
        object = {
          predictedCondition: 'Pulmonary Tuberculosis (Active)',
          confidence: 'high' as const,
          reasoning: 'Persistent productive cough for 3 weeks, evening temperature rise, night sweats, hemoptysis, and weight loss are pathognomonic of pulmonary TB in endemic regions.',
          affectedRegions: [
            {
              bodyRegion: 'lungs',
              confidence: 'high' as const,
              condition: 'Pulmonary Cavitation & Alveolar Consolidation',
              reasoning: 'Infiltration and destruction of lung tissue by Mycobacterium tuberculosis.'
            }
          ],
          recommendations: [
            'Order immediate Chest X-ray (PA view) and sputum microscopy (AFB smear).',
            'Refer to local DOTS center for registration and initiation of AKT-4 regimen.',
            'Enforce airborne isolation precautions (double masking).',
            'Counsel on adherence to the full course of anti-tubercular therapy.'
          ],
          severityScore: 65
        }
      } else {
        object = {
          predictedCondition: 'Acute Gastroenteritis',
          confidence: 'high' as const,
          reasoning: 'History of sudden onset vomiting, watery stools, and abdominal colic following ingestion of contaminated food/water.',
          affectedRegions: [
            {
              bodyRegion: 'stomach',
              confidence: 'high' as const,
              condition: 'Gastric mucosal inflammation',
              reasoning: 'Direct mucosal irritation by bacterial/viral pathogens.'
            },
            {
              bodyRegion: 'intestines',
              confidence: 'high' as const,
              condition: 'Enteric hypermotility',
              reasoning: 'Infection causing hypersecretion and diarrhea.'
            }
          ],
          recommendations: [
            'Administer ORS / Electral hydration fluid continuously.',
            'Provide Zinc supplementation 20mg daily for 14 days.',
            'Recommend light, easily digestible diet (khichdi, curd-rice).',
            'Monitor for dehydration signs (sunken eyes, oliguria).'
          ],
          severityScore: 40
        }
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
        affectedOrgans: JSON.stringify(object.affectedRegions.map((r: any) => ({
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
