import { NextResponse } from 'next/server'

// All valid organ IDs that can be highlighted on the 3D models
const VALID_ORGAN_IDS = [
  'brain', 'heart', 'lungs', 'liver', 'stomach', 
  'kidneys', 'intestines', 'throat', 'trachea', 'nasal_cavity',
  'lung_left', 'lung_right', 'kidney_left', 'kidney_right'
]

// Normalize synonyms from LLM output to our organ IDs
const normalizeOrganId = (raw: string): string[] => {
  const r = raw.toLowerCase().trim()
  if (r.includes('lung') || r === 'lungs' || r === 'pulmonary') return ['lungs']
  if (r === 'kidney' || r === 'kidneys' || r === 'renal') return ['kidneys']
  if (r === 'brain' || r === 'cerebral' || r === 'cerebrum') return ['brain']
  if (r === 'heart' || r === 'cardiac' || r === 'myocardium') return ['heart']
  if (r === 'liver' || r === 'hepatic') return ['liver']
  if (r === 'stomach' || r === 'gastric') return ['stomach']
  if (r === 'intestines' || r === 'intestine' || r === 'bowel' || r === 'colon') return ['intestines']
  if (r === 'throat' || r === 'pharynx' || r === 'larynx') return ['throat']
  if (r === 'trachea' || r === 'windpipe') return ['trachea']
  if (r.includes('nasal') || r === 'nose') return ['nasal_cavity']
  if (VALID_ORGAN_IDS.includes(r)) return [r]
  return []
}

export async function POST(req: Request) {
  try {
    const { age, sex, duration, severity, symptoms } = await req.json()

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    
    // Stub fallback if no API key
    if (!apiKey) {
      console.log('[analyze-symptoms-viewer] No DEEPSEEK_API_KEY. Running in STUB mode.')
      const text = symptoms.toLowerCase()
      
      let responseData = {
        affectedRegions: ['stomach', 'intestines'],
        possibleConditions: [{ name: 'Acute Gastroenteritis', confidence: 75, reasoning: 'Abdominal cramps and nausea suggest gastrointestinal inflammation.' }],
        redFlag: false
      }

      if (text.includes('chest') || text.includes('heart') || text.includes('retrosternal') || text.includes('angina')) {
        responseData = {
          affectedRegions: ['heart', 'lungs'],
          possibleConditions: [
            { name: 'Acute Coronary Syndrome (Suspected STEMI)', confidence: 95, reasoning: 'Retrosternal chest pressure with dyspnea is highly suspect for cardiac ischemia.' },
            { name: 'Acute Myocarditis', confidence: 60, reasoning: 'Inflammatory myocardial involvement secondary to systemic complaints.' }
          ],
          redFlag: true
        }
      } else if (text.includes('appendix') || text.includes('right abdomen') || text.includes('lower right')) {
        responseData = { affectedRegions: ['intestines'], possibleConditions: [{ name: 'Acute Appendicitis', confidence: 92, reasoning: 'Right lower quadrant tenderness with nausea matches appendicitis.' }], redFlag: true }
      } else if (text.includes('cough') || text.includes('sputum') || text.includes('tuberculosis') || text.includes('hemoptysis')) {
        responseData = { affectedRegions: ['lungs', 'trachea'], possibleConditions: [{ name: 'Pulmonary Tuberculosis (Active)', confidence: 90, reasoning: 'Productive cough >2 weeks with evening fever and night sweats.' }], redFlag: false }
      } else if (text.includes('fever') && (text.includes('joint') || text.includes('headache') || text.includes('dengue'))) {
        responseData = { affectedRegions: ['brain', 'liver'], possibleConditions: [{ name: 'Dengue Hemorrhagic Fever', confidence: 88, reasoning: 'High fever with retro-orbital pain and severe myalgia.' }], redFlag: false }
      }

      await new Promise(resolve => setTimeout(resolve, 800))
      return NextResponse.json(responseData)
    }

    // ─────────────────────────────────────────────────────────────────────
    // Call DeepSeek V3 (deepseek-chat) — fast, accurate, JSON mode
    // ─────────────────────────────────────────────────────────────────────
    const systemPrompt = `You are a senior clinical diagnostic AI integrated into a 3D human anatomy visualization platform used by clinicians in India.

Your task: Given patient symptoms, identify affected organs and rank differential diagnoses by likelihood.

STRICT RULES:
1. affectedRegions MUST only use values from this list: "brain", "heart", "lungs", "liver", "stomach", "kidneys", "intestines", "throat", "trachea", "nasal_cavity"
2. possibleConditions ranked highest confidence first
3. confidence is integer 0-100 reflecting real clinical probability
4. redFlag = true ONLY for life-threatening emergencies (MI, stroke, PE, sepsis, anaphylaxis, meningitis, severe head trauma)
5. reasoning is one concise sentence referencing specific symptoms
6. Prioritize high-incidence Indian conditions where relevant (Dengue, TB, Malaria, Typhoid, ACS)

Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Schema:
{
  "affectedRegions": ["heart", "lungs"],
  "possibleConditions": [
    { "name": "Acute Coronary Syndrome", "confidence": 95, "reasoning": "Severe chest pressure radiating to left arm with diaphoresis." }
  ],
  "redFlag": true
}`

    const userPrompt = `PATIENT PROFILE:
- Age: ${age || 'Not specified'}
- Sex: ${sex || 'Not specified'}
- Duration: ${duration || 'Not specified'}
- Severity: ${severity || 'Not specified'}

PRESENTING SYMPTOMS:
${symptoms}

Identify the affected organs and return differential diagnoses as JSON only.`

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[analyze-symptoms-viewer] DeepSeek API error:', response.status, errorText)
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content?.trim()
    
    if (!content) throw new Error('Empty response from DeepSeek')

    // Parse JSON robustly
    let parsedData: any
    try {
      parsedData = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not extract JSON from DeepSeek response')
      parsedData = JSON.parse(jsonMatch[0])
    }

    if (!parsedData.affectedRegions || !parsedData.possibleConditions) {
      throw new Error('Invalid response structure from DeepSeek')
    }

    // Normalize organ IDs to match our 3D model labels
    const normalizedRegions: string[] = []
    ;(parsedData.affectedRegions as string[]).forEach((raw: string) => {
      normalizeOrganId(raw).forEach(id => {
        if (!normalizedRegions.includes(id)) normalizedRegions.push(id)
      })
    })

    const finalResponse = {
      affectedRegions: normalizedRegions.length > 0 ? normalizedRegions : parsedData.affectedRegions,
      possibleConditions: parsedData.possibleConditions,
      redFlag: !!parsedData.redFlag
    }

    console.log('[analyze-symptoms-viewer] DeepSeek V3 analysis complete:', {
      regions: finalResponse.affectedRegions,
      conditions: finalResponse.possibleConditions.length,
      redFlag: finalResponse.redFlag
    })

    return NextResponse.json(finalResponse)

  } catch (error: any) {
    console.error('[analyze-symptoms-viewer] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze symptoms' },
      { status: 500 }
    )
  }
}
