import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { age, sex, duration, severity, symptoms } = await req.json()

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    
    // If API Key is not defined, use the realistic mock/stub fallback
    if (!apiKey) {
      console.log('[analyze-symptoms-viewer] No DEEPSEEK_API_KEY found. Running in STUB mode.')
      const text = symptoms.toLowerCase()
      
      let responseData = {
        affectedRegions: ['stomach', 'intestines'],
        possibleConditions: [
          {
            name: 'Acute Gastroenteritis',
            confidence: 75,
            reasoning: 'Presenting abdominal cramps, fever, and nausea suggest acute gastrointestinal tract inflammation.'
          }
        ],
        redFlag: false
      }

      if (text.includes('chest') || text.includes('heart') || text.includes('retrosternal') || text.includes('angina')) {
        responseData = {
          affectedRegions: ['heart', 'lungs'],
          possibleConditions: [
            {
              name: 'Acute Coronary Syndrome (Suspected STEMI)',
              confidence: 95,
              reasoning: 'Retrosternal chest pressure radiating to the shoulder with acute dyspnea is highly suspect for cardiac ischemia.'
            },
            {
              name: 'Acute Myocarditis',
              confidence: 60,
              reasoning: 'Inflammatory involvement of the myocardium secondary to systemic complaints.'
            }
          ],
          redFlag: true
        }
      } else if (text.includes('appendix') || text.includes('right abdomen') || text.includes('lower right') || text.includes('appendix pain')) {
        responseData = {
          affectedRegions: ['intestines'],
          possibleConditions: [
            {
              name: 'Acute Appendicitis',
              confidence: 92,
              reasoning: 'Localized tenderness, pain in the right lower quadrant, nausea, and low-grade pyrexia match clinical appendicitis.'
            }
          ],
          redFlag: true
        }
      } else if (text.includes('cough') || text.includes('sputum') || text.includes('tuberculosis') || text.includes('hemoptysis')) {
        responseData = {
          affectedRegions: ['lungs', 'trachea'],
          possibleConditions: [
            {
              name: 'Pulmonary Tuberculosis (Active)',
              confidence: 90,
              reasoning: 'Productive cough lasting over 2 weeks with evening fever and night sweats is diagnostic of active tuberculosis.'
            }
          ],
          redFlag: false
        }
      } else if (text.includes('fever') && (text.includes('joint') || text.includes('headache') || text.includes('dengue'))) {
        responseData = {
          affectedRegions: ['brain', 'liver'],
          possibleConditions: [
            {
              name: 'Dengue Hemorrhagic Fever',
              confidence: 88,
              reasoning: 'High continuous fever, retro-orbital pain, severe bone pain, and potential thrombopenic rash.'
            }
          ],
          redFlag: false
        }
      }

      // Add a slight artificial delay to mock realistic API roundtrip
      await new Promise(resolve => setTimeout(resolve, 800))
      return NextResponse.json(responseData)
    }

    // ─────────────────────────────────────────────────────
    // Call DeepSeek R1 API directly for symptom analysis
    // ─────────────────────────────────────────────────────
    const systemPrompt = `You are a senior clinical diagnostic AI assistant integrated into a 3D human anatomy visualization platform used by clinicians.

Your task: Given a patient's symptoms and profile, identify the EXACT affected body organs/regions and provide differential diagnoses with confidence scores.

CRITICAL RULES:
1. Map symptoms to ONLY these organ IDs: 'brain', 'heart', 'lungs', 'liver', 'stomach', 'kidneys', 'intestines', 'throat', 'trachea'
2. Provide medically accurate differential diagnoses ranked by likelihood
3. Include clinical reasoning for each diagnosis referencing specific symptoms
4. Flag any red-flag emergencies (e.g., MI, stroke, PE, sepsis, anaphylaxis)
5. Confidence scores must reflect real clinical probability (0-100)

Return ONLY a raw JSON object (no markdown, no backticks, no explanation text) matching this exact schema:
{
  "affectedRegions": ["heart", "lungs"],
  "possibleConditions": [
    {
      "name": "Acute Coronary Syndrome",
      "confidence": 95,
      "reasoning": "Severe chest pressure radiating to left arm with diaphoresis — classic presentation of acute myocardial infarction requiring emergent intervention."
    }
  ],
  "redFlag": true
}`

    const userPrompt = `PATIENT PROFILE:
- Age: ${age || 'Not specified'}
- Sex: ${sex || 'Not specified'}
- Duration of symptoms: ${duration || 'Not specified'}
- Severity: ${severity || 'Not specified'}

PRESENTING SYMPTOMS:
${symptoms}

Analyze these symptoms and map them to the correct anatomical organs. Provide differential diagnoses with confidence scores and clinical reasoning.`

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2048,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[analyze-symptoms-viewer] DeepSeek API error:', response.status, errorText)
      throw new Error(`DeepSeek API responded with ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      throw new Error('Received empty response content from DeepSeek R1')
    }

    // Parse the JSON content — strip markdown wrapping if present
    const cleanJson = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    const parsedData = JSON.parse(cleanJson)

    // Validate the response structure
    if (!parsedData.affectedRegions || !parsedData.possibleConditions) {
      throw new Error('Invalid response structure from DeepSeek R1')
    }

    console.log('[analyze-symptoms-viewer] DeepSeek R1 analysis complete:', {
      regions: parsedData.affectedRegions,
      conditions: parsedData.possibleConditions.length,
      redFlag: parsedData.redFlag
    })

    return NextResponse.json(parsedData)

  } catch (error: any) {
    console.error('[analyze-symptoms-viewer] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete symptoms diagnostic analysis' },
      { status: 500 }
    )
  }
}
