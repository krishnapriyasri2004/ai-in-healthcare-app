import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { age, sex, duration, severity, symptoms } = await req.json()

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    
    // If API Key is not defined, use the realistic mock/stub fallback
    if (!apiKey) {
      console.log('[analyze-symptoms-viewer] No OPENROUTER_API_KEY found. Running in STUB mode.')
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

    // Call OpenRouter / DeepSeek R1 API
    const systemPrompt = `You are a medical AI assistant. Analyze symptoms to isolate affected body regions/organs (choose only from: 'brain', 'heart', 'lungs', 'liver', 'stomach', 'kidneys', 'intestines', 'throat', 'trachea'). Explain potential conditions with confidence scores and flag clinical emergencies.

Return ONLY a raw JSON object matching this schema. Do not output any markdown code blocks, backticks, or explanation text:
{
  "affectedRegions": ["heart", "lungs"],
  "possibleConditions": [
    {
      "name": "Acute Coronary Syndrome",
      "confidence": 95,
      "reasoning": "Severe chest pressure radiating to arm suggests active myocardial infarction."
    }
  ],
  "redFlag": true
}`

    const userPrompt = `Patient Profile: Age ${age}, Sex: ${sex}, Duration: ${duration}, Severity: ${severity}
Presenting Symptoms: ${symptoms}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/krishnapriyasri2004/ai-in-healthcare',
        'X-Title': 'Anatomy Visualization Platform'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API responded with ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      throw new Error('Received empty response content from OpenRouter')
    }

    // Parse the JSON content directly
    // Strips any potential markdown wrapping if returned by the LLM
    const cleanJson = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    const parsedData = JSON.parse(cleanJson)

    return NextResponse.json(parsedData)

  } catch (error: any) {
    console.error('[analyze-symptoms-viewer] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete symptoms diagnostic analysis' },
      { status: 500 }
    )
  }
}
