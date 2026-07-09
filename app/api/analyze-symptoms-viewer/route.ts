import { NextResponse } from 'next/server'

const VALID_ORGAN_IDS = [
  'brain', 'heart', 'lungs', 'liver', 'stomach',
  'kidneys', 'intestines', 'throat', 'trachea', 'nasal_cavity',
  'lung_left', 'lung_right', 'kidney_left', 'kidney_right'
]

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

// Smart keyword-based stub — used when DeepSeek API is unavailable or out of credits
function runSmartStub(symptoms: string) {
  const text = symptoms.toLowerCase()

  if (text.includes('chest') || text.includes('heart') || text.includes('retrosternal') || text.includes('angina') || text.includes('palpitation')) {
    return NextResponse.json({
      affectedRegions: ['heart', 'lungs'],
      possibleConditions: [
        { name: 'Acute Coronary Syndrome (Suspected STEMI)', confidence: 95, reasoning: 'Retrosternal chest pressure with acute dyspnea is highly suspect for cardiac ischemia.' },
        { name: 'Acute Myocarditis', confidence: 60, reasoning: 'Inflammatory myocardial involvement secondary to systemic complaints.' }
      ],
      redFlag: true
    })
  }

  if (text.includes('appendix') || text.includes('lower right') || text.includes('right lower')) {
    return NextResponse.json({
      affectedRegions: ['intestines'],
      possibleConditions: [
        { name: 'Acute Appendicitis', confidence: 92, reasoning: 'Right lower quadrant tenderness with nausea and low-grade fever matches clinical appendicitis.' }
      ],
      redFlag: true
    })
  }

  if (text.includes('cough') || text.includes('sputum') || text.includes('tuberculosis') || text.includes('hemoptysis') || text.includes('blood in sputum')) {
    return NextResponse.json({
      affectedRegions: ['lungs', 'trachea'],
      possibleConditions: [
        { name: 'Pulmonary Tuberculosis (Active)', confidence: 90, reasoning: 'Productive cough lasting over 2 weeks with evening fever, night sweats, and hemoptysis.' }
      ],
      redFlag: false
    })
  }

  if ((text.includes('fever') || text.includes('temperature')) && (text.includes('joint') || text.includes('headache') || text.includes('dengue') || text.includes('retro-orbital') || text.includes('breakbone'))) {
    return NextResponse.json({
      affectedRegions: ['brain', 'liver'],
      possibleConditions: [
        { name: 'Dengue Hemorrhagic Fever', confidence: 88, reasoning: 'High continuous fever, retro-orbital pain and severe myalgia with thrombocytopenic signs.' }
      ],
      redFlag: false
    })
  }

  if (text.includes('breath') || text.includes('shortness') || text.includes('wheez') || text.includes('asthma')) {
    return NextResponse.json({
      affectedRegions: ['lungs', 'trachea'],
      possibleConditions: [
        { name: 'Acute Bronchospasm / Asthma Exacerbation', confidence: 85, reasoning: 'Wheezing, breathlessness and use of accessory muscles indicate reactive airway disease.' }
      ],
      redFlag: false
    })
  }

  if (text.includes('kidney') || text.includes('flank') || text.includes('urination') || text.includes('dysuria') || text.includes('urine')) {
    return NextResponse.json({
      affectedRegions: ['kidneys'],
      possibleConditions: [
        { name: 'Urinary Tract Infection / Pyelonephritis', confidence: 82, reasoning: 'Dysuria, flank pain and frequency of urination suggest urinary tract involvement.' }
      ],
      redFlag: false
    })
  }

  if (text.includes('headache') || text.includes('migraine') || text.includes('dizzy') || text.includes('vertigo') || text.includes('brain') || text.includes('stroke') || text.includes('seizure')) {
    return NextResponse.json({
      affectedRegions: ['brain'],
      possibleConditions: [
        { name: 'Acute Neurological Event (Rule out Stroke)', confidence: 80, reasoning: 'Sudden severe headache with neurological symptoms requires urgent stroke workup.' }
      ],
      redFlag: text.includes('stroke') || text.includes('seizure') || text.includes('paralysis')
    })
  }

  if (text.includes('liver') || text.includes('jaundice') || text.includes('yellow') || text.includes('hepatitis')) {
    return NextResponse.json({
      affectedRegions: ['liver'],
      possibleConditions: [
        { name: 'Acute Hepatitis / Jaundice', confidence: 78, reasoning: 'Jaundice, right upper quadrant pain and dark urine suggest hepatic involvement.' }
      ],
      redFlag: false
    })
  }

  // Default — gastrointestinal
  return NextResponse.json({
    affectedRegions: ['stomach', 'intestines'],
    possibleConditions: [
      { name: 'Acute Gastroenteritis', confidence: 72, reasoning: 'Abdominal pain, nausea, vomiting and diarrhea suggest gastrointestinal inflammation.' },
      { name: 'Irritable Bowel Syndrome', confidence: 45, reasoning: 'Recurrent abdominal discomfort with altered bowel habits.' }
    ],
    redFlag: false
  })
}

export async function POST(req: Request) {
  try {
    const { age, sex, duration, severity, symptoms } = await req.json()

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY

    if (!apiKey) {
      console.log('[analyze-symptoms-viewer] No API key — using smart stub')
      await new Promise(resolve => setTimeout(resolve, 600))
      return runSmartStub(symptoms)
    }

    // ── DeepSeek V3 API Call ──
    const systemPrompt = `You are a senior clinical diagnostic AI integrated into a 3D human anatomy visualization platform used by clinicians in India.

Your task: Given patient symptoms, identify affected organs and rank differential diagnoses by likelihood.

STRICT RULES:
1. affectedRegions MUST only use values from this list: "brain", "heart", "lungs", "liver", "stomach", "kidneys", "intestines", "throat", "trachea", "nasal_cavity"
2. possibleConditions ranked highest confidence first
3. confidence is integer 0-100 reflecting real clinical probability
4. redFlag = true ONLY for life-threatening emergencies (MI, stroke, PE, sepsis, anaphylaxis, meningitis)
5. reasoning is one concise sentence referencing specific symptoms
6. Prioritize high-incidence Indian conditions (Dengue, TB, Malaria, Typhoid, ACS)

Return ONLY raw JSON. No markdown. No backticks. Schema:
{"affectedRegions":["heart"],"possibleConditions":[{"name":"...","confidence":95,"reasoning":"..."}],"redFlag":true}`

    const userPrompt = `PATIENT PROFILE:
- Age: ${age || 'Not specified'}
- Sex: ${sex || 'Not specified'}
- Duration: ${duration || 'Not specified'}
- Severity: ${severity || 'Not specified'}

SYMPTOMS: ${symptoms}

Return differential diagnoses as JSON only.`

    let response: Response
    try {
      response = await fetch('https://api.deepseek.com/chat/completions', {
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
    } catch (fetchErr) {
      console.warn('[analyze-symptoms-viewer] Network error reaching DeepSeek — falling back to stub:', fetchErr)
      return runSmartStub(symptoms)
    }

    // Handle non-200 from DeepSeek (402 = no credits, 429 = rate limit, etc.)
    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`[analyze-symptoms-viewer] DeepSeek returned ${response.status} — falling back to stub. Error: ${errorText}`)
      return runSmartStub(symptoms)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content?.trim()

    if (!content) {
      console.warn('[analyze-symptoms-viewer] Empty DeepSeek response — falling back to stub')
      return runSmartStub(symptoms)
    }

    // Parse JSON robustly
    let parsedData: any
    try {
      parsedData = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.warn('[analyze-symptoms-viewer] Could not parse DeepSeek JSON — falling back to stub')
        return runSmartStub(symptoms)
      }
      parsedData = JSON.parse(jsonMatch[0])
    }

    if (!parsedData.affectedRegions || !parsedData.possibleConditions) {
      console.warn('[analyze-symptoms-viewer] Invalid structure from DeepSeek — falling back to stub')
      return runSmartStub(symptoms)
    }

    // Normalize organ IDs
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

    console.log('[analyze-symptoms-viewer] DeepSeek V3 success:', {
      regions: finalResponse.affectedRegions,
      conditions: finalResponse.possibleConditions.length,
      redFlag: finalResponse.redFlag
    })

    return NextResponse.json(finalResponse)

  } catch (error: any) {
    console.error('[analyze-symptoms-viewer] Unexpected error:', error)
    // Last resort — return stub instead of 500
    try {
      const body = await (req as any).json?.()
      return runSmartStub(body?.symptoms || '')
    } catch {
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
  }
}
