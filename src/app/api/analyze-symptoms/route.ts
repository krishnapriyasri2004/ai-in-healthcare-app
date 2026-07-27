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

    // ── STEP 0: Attempt Google Gemini API (Recommended) ───────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nReturn strict JSON following the schema and instructions.`;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        });
        
        if (geminiRes.ok) {
          const resJson = await geminiRes.json();
          const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            object = JSON.parse(text);
            console.log('[analyze-symptoms] Gemini API successfully analyzed symptoms!');
          }
        } else {
          console.log('[analyze-symptoms] Gemini API request failed:', await geminiRes.text());
        }
      } catch (e) {
        console.log('[analyze-symptoms] Gemini API integration error:', e);
      }
    }

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
          
          // Because we prompted the model with "{", we need to prepend it
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

      const ruleMatches: Array<{
        condition: string
        confidence: 'high' | 'medium' | 'low'
        reasoning: string
        regions: Array<{
          bodyRegion: string
          confidence: 'high' | 'medium' | 'low'
          condition: string
          reasoning: string
        }>
        recommendations: string[]
        severityScore: number
        score: number
      }> = []

      const RULES = [
        {
          keywords: ['ear', 'otitis', 'hearing', 'tinnitus', 'eardrum', 'canal', 'auditory', 'mastoid', 'tympanic', 'audiometry', 'vestibular'],
          condition: "Otitis Media / Eustachian Tube Dysfunction",
          confidence: "high" as const,
          reasoning: "Ear discomfort associated with pressure feeling, likely secondary to upper respiratory tract congestion or auditory canal block.",
          regions: [
            {
              bodyRegion: "brain",
              confidence: "medium" as const,
              condition: "Auditory referral",
              reasoning: "Referred sensation via cranial nerve pathways to auditory centers."
            },
            {
              bodyRegion: "nasal_cavity",
              confidence: "high" as const,
              condition: "Eustachian tube congestion",
              reasoning: "Blockage at nasopharyngeal junction leading to middle ear pressure build-up."
            }
          ],
          recommendations: [
            "Perform otoscopic examination of the external canal and tympanic membrane.",
            "Avoid insertion of cotton buds or foreign objects.",
            "Consider nasal decongestants if associated with cold/sinus congestion.",
            "Seek ENT consultation if pain is severe, pulsing, or accompanied by discharge."
          ],
          severityScore: 35
        },
        {
          keywords: ['eye', 'vision', 'orbital', 'blur', 'blind', 'retina', 'cornea', 'cataract', 'glaucoma', 'ophthalmic'],
          condition: "Sinusitis / Referred Orbital Cephalgia",
          confidence: "medium" as const,
          reasoning: "Retro-orbital pain or visual discomfort, commonly secondary to surrounding sinus pressure or visual fatigue.",
          regions: [
            {
              bodyRegion: "brain",
              confidence: "medium" as const,
              condition: "Visual pathway strain",
              reasoning: "Secondary strain along visual tracts."
            },
            {
              bodyRegion: "nasal_cavity",
              confidence: "high" as const,
              condition: "Paranasal sinus congestion",
              reasoning: "Close proximity of maxillary and frontal sinuses to the orbit causes referred orbital pain."
            }
          ],
          recommendations: [
            "Assess visual acuity and pupillary reflexes.",
            "Conduct sinus palpation for tenderness.",
            "Refer to ophthalmology or ENT as clinically indicated."
          ],
          severityScore: 45
        },
        {
          keywords: ['headache', 'migraine', 'head', 'brain', 'seizure', 'convulsion', 'concussion', 'dizzy', 'dizziness', 'vertigo', 'cranial', 'skull'],
          condition: "Primary Headache Disorder / Tension Migraine",
          confidence: "high" as const,
          reasoning: "Bilateral or unilateral throbbing pain with neck stiffness, vertigo, or sensory hypersensitivity.",
          regions: [
            {
              bodyRegion: "brain",
              confidence: "high" as const,
              condition: "Neurovascular hypersensitivity",
              reasoning: "Trigeminal nerve pathway activation causing migraine cephalgia."
            }
          ],
          recommendations: [
            "Rest in a quiet, dark room.",
            "Administer simple analgesics like paracetamol if not contraindicated.",
            "Keep hydration level high and avoid caffeine triggers."
          ],
          severityScore: 50
        },
        {
          keywords: ['chest', 'heart', 'cardiac', 'angina', 'stemi', 'nstemi', 'infarction', 'palpitation', 'aorta', 'vessel', 'coronary', 'retrosternal', 'pulse', 'bpm', 'bp'],
          condition: "Acute Coronary Syndrome (STEMI Risk)",
          confidence: "high" as const,
          reasoning: "Retrosternal chest pressure with radiation to the left arm in a patient with cardiovascular risk factors is highly suspect for acute myocardial ischemia.",
          regions: [
            {
              bodyRegion: "heart",
              confidence: "high" as const,
              condition: "Myocardial Ischemia",
              reasoning: "Compromised coronary artery perfusion causing active cardiac cellular strain."
            },
            {
              bodyRegion: "lungs",
              confidence: "medium" as const,
              condition: "Secondary Pulmonary Congestion",
              reasoning: "Mild respiratory backlog from transient cardiac output reduction."
            }
          ],
          recommendations: [
            'Perform immediate 12-lead ECG bedside.',
            'Administer loading doses of Aspirin 325mg and Clopidogrel 300mg stat.',
            'Establish double-bore IV access and start low-flow oxygen.',
            'Urgent activation of the Cardiac Cath Lab routing.'
          ],
          severityScore: 90
        },
        {
          keywords: ['dengue', 'fever', 'joint', 'rash', 'petechiae', 'malaria', 'typhoid', 'chills', 'lymph', 'nodes', 'skin'],
          condition: "Dengue Hemorrhagic Fever (Suspected)",
          confidence: "high" as const,
          reasoning: "High-grade continuous pyrexia, severe retro-orbital headache, arthralgia/myalgia (breakbone fever), and thrombocytopenic signs point to Dengue virus infection.",
          regions: [
            {
              bodyRegion: "brain",
              confidence: "medium" as const,
              condition: "Retro-orbital neuralgia",
              reasoning: "Intense headache from systemic viral infection."
            },
            {
              bodyRegion: "liver",
              confidence: "medium" as const,
              condition: "Hepatitis / Hepatic congestion",
              reasoning: "Common site of secondary viral inflammation in Dengue cases."
            }
          ],
          recommendations: [
            'Administer Paracetamol (Dolo 650mg) SOS for fever control. Strict avoidance of NSAIDs.',
            'Initiate aggressive oral fluid resuscitation using ORS/Electral.',
            'Monitor platelet counts and hematocrit daily.',
            'Advise warning signs for hospitalization: persistent vomiting, mucosal bleeding.'
          ],
          severityScore: 70
        },
        {
          keywords: ['cough', 'lung', 'breathe', 'breath', 'dyspnea', 'sob', 'wheeze', 'asthma', 'pneumonia', 'tuberculosis', 'tb', 'sputum', 'hemoptysis', 'bronchial', 'pleural', 'respiratory'],
          condition: "Pulmonary Tuberculosis (Active)",
          confidence: "high" as const,
          reasoning: "Persistent productive cough for 3 weeks, evening temperature rise, night sweats, hemoptysis, and weight loss are pathognomonic of pulmonary TB in endemic regions.",
          regions: [
            {
              bodyRegion: "lungs",
              confidence: "high" as const,
              condition: "Pulmonary Cavitation & Alveolar Consolidation",
              reasoning: "Infiltration and destruction of lung tissue by Mycobacterium tuberculosis."
            }
          ],
          recommendations: [
            'Order immediate Chest X-ray (PA view) and sputum microscopy (AFB smear).',
            'Refer to local DOTS center for registration and initiation of AKT-4 regimen.',
            'Enforce airborne isolation precautions (double masking).',
            'Counsel on adherence to the full course of anti-tubercular therapy.'
          ],
          severityScore: 65
        },
        {
          keywords: ['appendicitis', 'appendix', 'mcburney', 'rlq', 'lower right'],
          condition: "Acute Appendicitis (Suspected)",
          confidence: "high" as const,
          reasoning: "Migrating pain to the right lower quadrant with positive peritoneal signs suggests acute appendiceal inflammation.",
          regions: [
            {
              bodyRegion: "intestines",
              confidence: "high" as const,
              condition: "Inflamed cecal/appendiceal segment",
              reasoning: "Obstruction of appendix lumen leading to acute distension."
            }
          ],
          recommendations: [
            "Maintain NPO (nothing by mouth) status.",
            "Urgent surgical consult for appendectomy routing.",
            "Perform abdominal ultrasound or CT to confirm."
          ],
          severityScore: 85
        },
        {
          keywords: ['stomach', 'vomit', 'nausea', 'gastric', 'acid', 'heartburn', 'gerd', 'indigestion', 'digestive', 'abdominal', 'abdomen', 'colic', 'cramp', 'cramping', 'intestine', 'bowel', 'colon', 'diarrhea', 'constipation'],
          condition: "Acute Gastroenteritis",
          confidence: "high" as const,
          reasoning: "History of sudden onset vomiting, watery stools, and abdominal colic following ingestion of contaminated food/water.",
          regions: [
            {
              bodyRegion: 'stomach',
              confidence: 'high' as const,
              condition: 'Gastric mucosal irritation',
              reasoning: 'Direct mucosal irritation by enteric pathogens.'
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
        },
        {
          keywords: ['bone', 'fracture', 'joint', 'ribs', 'pelvis', 'femur', 'tibia', 'fibula', 'patella', 'humerus', 'radius', 'ulna', 'clavicle', 'scapula', 'skeletal', 'spine', 'vertebrae'],
          condition: "Skeletal Injury / Bone Trauma",
          confidence: "high" as const,
          reasoning: "Reported trauma or pain localizing to skeletal joints or bony structures.",
          regions: [
            {
              bodyRegion: "skeleton",
              confidence: "high" as const,
              condition: "Localized skeletal stress",
              reasoning: "Potential focal fracture or joint misalignment."
            }
          ],
          recommendations: [
            "Request plain radiography (X-ray) of the affected joint or bone.",
            "Immobilize the affected limb to prevent displacement.",
            "Consult orthopedic surgery for definitive care."
          ],
          severityScore: 60
        },
        {
          keywords: ['muscle', 'strain', 'sprain', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'deltoid', 'pectoral', 'gluteus', 'calf', 'myalgia'],
          condition: "Acute Muscle Strain",
          confidence: "high" as const,
          reasoning: "Soft tissue strain or muscle fiber injury due to mechanical overload.",
          regions: [
            {
              bodyRegion: "muscles",
              confidence: "high" as const,
              condition: "Myofibrillar strain",
              reasoning: "Inflammatory response following focal muscle fiber tear."
            }
          ],
          recommendations: [
            "Apply RICE protocol (Rest, Ice, Compression, Elevation).",
            "Avoid painful loading and heavy eccentric contractions.",
            "Consider soft tissue ultrasound if tearing is suspected."
          ],
          severityScore: 40
        },
        {
          keywords: ['leg', 'thigh', 'knee', 'shin', 'calf', 'ankle', 'foot', 'femur', 'tibia', 'patella', 'fibula', 'quadriceps', 'hamstrings', 'gluteus'],
          condition: "Lower Extremity Strain / Leg Pain",
          confidence: "high" as const,
          reasoning: "Pain localizing to lower extremity skeletal or muscular structures, often post-activity.",
          regions: [
            {
              bodyRegion: "skeleton",
              confidence: "high" as const,
              condition: "Leg bone correlation",
              reasoning: "Weight-bearing impact on lower limb bones."
            },
            {
              bodyRegion: "muscles",
              confidence: "high" as const,
              condition: "Leg muscle strain",
              reasoning: "Locomotor muscle strain (quadriceps/hamstrings/calf)."
            }
          ],
          recommendations: [
            "Evaluate gait and weight-bearing capability.",
            "Obtain X-ray if localized bone tenderness is present.",
            "Counsel on muscle rest and light stretching."
          ],
          severityScore: 45
        },
        {
          keywords: ['arm', 'shoulder', 'elbow', 'wrist', 'hand', 'humerus', 'radius', 'ulna', 'clavicle', 'scapula', 'biceps', 'triceps', 'deltoid'],
          condition: "Upper Extremity Strain / Arm Pain",
          confidence: "high" as const,
          reasoning: "Symptom localization to upper limb musculoskeletal structures.",
          regions: [
            {
              bodyRegion: "skeleton",
              confidence: "medium" as const,
              condition: "Arm skeletal focus",
              reasoning: "Strain along humerus, radius, or ulna joints."
            },
            {
              bodyRegion: "muscles",
              confidence: "high" as const,
              condition: "Arm muscle focus",
              reasoning: "Strain of biceps, triceps, or deltoid muscles."
            }
          ],
          recommendations: [
            "Check joint range of motion and distal pulses.",
            "Support arm with a sling if severe joint pain exists.",
            "Recommend relative rest and local warm compress."
          ],
          severityScore: 40
        }
      ]

      // Count scores
      for (const rule of RULES) {
        let score = 0
        for (const kw of rule.keywords) {
          if (text.includes(kw)) {
            score += 10
            const regex = new RegExp(`\\b${kw}\\b`, 'i')
            if (regex.test(text)) {
              score += 20
            }
          }
        }
        if (score > 0) {
          ruleMatches.push({ ...rule, score })
        }
      }

      ruleMatches.sort((a, b) => b.score - a.score)

      if (ruleMatches.length > 0) {
        const best = ruleMatches[0]
        object = {
          predictedCondition: best.condition,
          confidence: best.confidence,
          reasoning: best.reasoning,
          affectedRegions: best.regions,
          recommendations: best.recommendations,
          severityScore: best.severityScore
        }
      } else {
        // Fallback Default
        object = {
          predictedCondition: 'Acute Gastroenteritis / Non-specific Abdominal distress',
          confidence: 'medium' as const,
          reasoning: 'History of sudden onset abdominal discomfort, nausea, or cramping.',
          affectedRegions: [
            {
              bodyRegion: 'stomach',
              confidence: 'high' as const,
              condition: 'Gastric mucosal irritation',
              reasoning: 'Direct mucosal irritation by pathogens.'
            },
            {
              bodyRegion: 'intestines',
              confidence: 'high' as const,
              condition: 'Enteric hypermotility',
              reasoning: 'Infection causing diarrhea/discomfort.'
            }
          ],
          recommendations: [
            'Administer hydration fluid continuously.',
            'Recommend light, easily digestible diet.'
          ],
          severityScore: 35
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
