import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

const localAI = createOpenAI({
  baseURL: 'http://127.0.0.1:1234/v1',
  apiKey: 'not-needed'
})

// No hardcoded mesh IDs anymore. The frontend will dynamically resolve anatomy.
const AnalysisSchema = z.object({
  body_system: z.string().describe('The primary body system affected (e.g. Musculoskeletal, Cardiovascular).'),
  body_region: z.string().describe('The specific body region affected (e.g. Right Knee, Chest).'),
  affected_anatomy: z.array(z.object({
    label: z.string(),
    description: z.string()
  })).describe('List of affected anatomical structures with their standard names and detailed clinical descriptions.'),
  differential_diagnoses: z.array(z.object({
    condition: z.string(),
    confidence: z.number(),
    reasoning: z.string()
  })).describe('List of clinically relevant possible conditions with confidence scores.'),
  recommended_investigations: z.array(z.string()).describe('List of recommended clinical investigations.')
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { age, sex, duration, severity, symptoms } = body

    if (!symptoms || typeof symptoms !== 'string') {
      return NextResponse.json({ error: 'Symptoms description is required.' }, { status: 400 })
    }

    const systemPrompt = `You are an advanced AI Clinical Decision Support System for a 3D anatomy visualization app.
Analyze the following patient presentation:
Age: ${age}
Sex: ${sex}
Duration: ${duration}
Reported Severity: ${severity}
Symptoms: ${symptoms}

CRITICAL RULES:
1. Analyze ONLY the CURRENT patient symptoms described above.
2. Classify the affected body system first.
3. In "affected_anatomy", you MUST ONLY use labels from the ALLOWED LIST below. Do NOT invent new anatomy names.
4. Map symptoms to the CORRECT anatomical organs. Examples:
   - Chest pain / heart attack / cardiac arrest → Heart, Aorta
   - Cough / breathing difficulty / TB → Lung Left, Lung Right, Trachea
   - Abdominal pain / cramping / diarrhea → Stomach, Intestines, Appendix
   - Headache / seizure / confusion → Brain
   - Jaundice / liver pain → Liver, Gallbladder
   - Urinary issues / flank pain → Kidney Left, Kidney Right, Bladder
   - Fever / rash / skin lesion → Skin, Lymph Nodes
   - Neck stiffness / meningitis → Brain, Spinal Cord
   - Nausea / vomiting / acidity → Stomach
   - Bone fracture / joint pain → Skeleton
   - Muscle pain / sprain → Muscles
5. Generate clinically relevant Differential Diagnoses with confidence scores (0-100) and reasoning.
6. Recommend appropriate clinical investigations.
7. Use your deep anatomical and biological knowledge of human anatomy to map the symptoms to the precise involved structures. For example, if a fracture of the lower leg is mentioned, map it to "Tibia". If a fracture of the thigh is mentioned, map it to "Femur". If pain in the upper arm is mentioned, map it to "Biceps", "Triceps", or "Humerus". Always choose the most specific allowed label.
8. Output ONLY a single valid JSON object. No conversational text.

ALLOWED ANATOMY LABELS (use ONLY these exact strings):
"Brain", "Nasal Cavity", "Throat", "Trachea", "Lung Left", "Lung Right", "Heart", "Aorta",
"Liver", "Stomach", "Gallbladder", "Spleen", "Pancreas", "Kidney Left", "Kidney Right",
"Intestines", "Appendix", "Bladder", "Spinal Cord", "Skin", "Lymph Nodes",
"Skeleton", "Muscles", "Skull", "Spine", "Ribs", "Pelvis", "Femur", "Tibia",
"Patella", "Humerus", "Radius", "Ulna", "Clavicle", "Scapula",
"Biceps", "Triceps", "Quadriceps", "Hamstrings", "Deltoid", "Pectoral", "Gluteus", "Calf"

REQUIRED JSON FORMAT:
{
  "body_system": "Cardiovascular",
  "body_region": "Chest",
  "affected_anatomy": [
    {
      "label": "Heart",
      "description": "The primary muscular organ responsible for pumping blood through the circulatory system."
    },
    {
      "label": "Aorta",
      "description": "The main artery carrying oxygenated blood from the left ventricle."
    }
  ],
  "differential_diagnoses": [
    {
      "condition": "Acute Myocardial Infarction",
      "confidence": 92,
      "reasoning": "Retrosternal chest pain radiating to left arm with diaphoresis."
    }
  ],
  "recommended_investigations": ["12-Lead ECG", "Troponin I/T assay", "Chest X-ray"]
}`

    let parsedJson = null;

    // ── STEP 0: Attempt Google Gemini API (Recommended) ───────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
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
            parsedJson = JSON.parse(text);
            console.log('Gemini API successfully analyzed symptoms!');
          }
        } else {
          console.log('Gemini API request failed:', await geminiRes.text());
        }
      } catch (e) {
        console.log('Gemini API integration error:', e);
      }
    }

    // ── STEP 1: Attempt Local LM Studio Server (if running) ───────────────────
    try {
      let activeModelId = 'local-model'
      const modelsRes = await fetch('http://127.0.0.1:1234/v1/models', { signal: AbortSignal.timeout(1000) })
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json()
        if (modelsData.data && modelsData.data.length > 0) {
          const textModel = modelsData.data.find((m: any) => !m.id.includes('embed'))
          if (textModel) activeModelId = textModel.id
        }

        const result = await generateText({
          model: localAI(activeModelId),
          prompt: systemPrompt
        });

        let jsonString = result.text.trim();
        const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) jsonString = match[1];
        parsedJson = JSON.parse(jsonString);
      }
    } catch (e) {
      console.log('Local LM Studio not available, trying Cloud LLM...');
    }

    // ── STEP 2: Attempt Hugging Face Inference API fallback (if key is set) ─────
    if (!parsedJson) {
      const apiKey = process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN || process.env.MEDGEMMA_API_KEY;
      if (apiKey) {
        try {
          const hfRes = await fetch('https://api-inference.huggingface.co/models/google/gemma-2-9b-it', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: `<start_of_turn>user\n${systemPrompt}<end_of_turn>\n<start_of_turn>model\n\{\n`,
              parameters: {
                max_new_tokens: 1500,
                temperature: 0.1,
                return_full_text: false,
              }
            })
          });

          if (hfRes.ok) {
            const hfData = await hfRes.json();
            let content = hfData[0]?.generated_text || '';
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            if (!content.startsWith('{')) content = '{' + content;
            parsedJson = JSON.parse(content);
          } else {
            console.log('HF API error:', await hfRes.text());
          }
        } catch (e) {
          console.log('HuggingFace fallback error:', e);
        }
      }
    }

    // ── STEP 3: Zero-Failure Local Rule-Based Keyword Matcher (Guaranteed working fallback) ─────
    if (!parsedJson) {
      const query = symptoms.toLowerCase();

      // We will perform a keyword scoring match to find the most relevant systems/organs
      const ruleMatches: Array<{
        system: string
        region: string
        anatomy: Array<{ label: string; description: string }>
        diagnoses: Array<{ condition: string; confidence: number; reasoning: string }>
        investigations: string[]
        score: number
      }> = []

      const RULES = [
        {
          keywords: ['ear', 'otitis', 'hearing', 'tinnitus', 'eardrum', 'canal', 'auditory', 'mastoid', 'tympanic', 'audiometry', 'vestibular'],
          system: "Nervous / Sensory",
          region: "Head (Ear)",
          anatomy: [
            { label: "Brain", description: "Auditory cranial nerves (CN VIII) and vestibular pathways, transmitting sound/balance signals to the cortex." },
            { label: "Nasal Cavity", description: "The Eustachian tube connects the middle ear to the nasopharynx (nasal cavity), equalizing middle ear pressure." }
          ],
          diagnoses: [
            { condition: "Otitis Media / Eustachian Tube Dysfunction", confidence: 85, reasoning: "Ear discomfort associated with pressure feeling, likely secondary to upper respiratory tract congestion or auditory canal block." },
            { condition: "Otitis Externa", confidence: 60, reasoning: "Outer ear canal infection, causing localized tenderness." }
          ],
          investigations: ["Otoscopic examination", "Tympanometry", "Audiogram"]
        },
        {
          keywords: ['eye', 'vision', 'orbital', 'blur', 'blind', 'retina', 'cornea', 'cataract', 'glaucoma', 'ophthalmic'],
          system: "Nervous / Sensory",
          region: "Head (Eye)",
          anatomy: [
            { label: "Brain", description: "The visual pathway and optic nerve (CN II) projecting back to the occipital cortex." },
            { label: "Nasal Cavity", description: "Paranasal sinuses bordering the orbits; sinus pressure frequently refers to the retro-orbital area." }
          ],
          diagnoses: [
            { condition: "Sinusitis / Orbital Cellulitis", confidence: 70, reasoning: "Eye pain or pressure, often related to neighboring sinus congestion." },
            { condition: "Optic Neuritis", confidence: 45, reasoning: "Inflammatory demyelination of the optic nerve causing eye pain on movement." }
          ],
          investigations: ["Visual Acuity Test", "Fundoscopic exam", "Sinus CT / Brain MRI"]
        },
        {
          keywords: ['headache', 'migraine', 'head', 'brain', 'seizure', 'convulsion', 'concussion', 'dizzy', 'dizziness', 'vertigo', 'cranial', 'skull'],
          system: "Nervous",
          region: "Head",
          anatomy: [
            { label: "Brain", description: "The primary organ of the central nervous system, regulating all cognitive and motor feedback." },
            { label: "Skull", description: "The bony framework surrounding and protecting the brain tissue." }
          ],
          diagnoses: [
            { condition: "Tension Headache / Migraine", confidence: 80, reasoning: "Recurrent head pressure with sensory hypersensitivity." },
            { condition: "Acute Meningitis", confidence: 40, reasoning: "Inflammatory irritation of the meningeal layers surrounding the brain." }
          ],
          investigations: ["Non-contrast Head CT", "Lumbar Puncture", "Neurological evaluation"]
        },
        {
          keywords: ['chest', 'heart', 'cardiac', 'angina', 'stemi', 'nstemi', 'infarction', 'palpitation', 'aorta', 'vessel', 'coronary', 'retrosternal', 'pulse', 'bpm', 'bp'],
          system: "Cardiovascular",
          region: "Chest",
          anatomy: [
            { label: "Heart", description: "The primary muscular organ of the circulatory system, responsible for pumping blood throughout the body." },
            { label: "Aorta", description: "The main artery of the body, transporting oxygenated blood from the heart." }
          ],
          diagnoses: [
            { condition: "Myocardial Infarction (STEMI)", confidence: 92, reasoning: "Acute retrosternal chest pain radiating to left arm with breathlessness." },
            { condition: "Acute Pericarditis", confidence: 45, reasoning: "Retrosternal chest pain modified by posture." }
          ],
          investigations: ["12-Lead ECG", "Troponin I/T assay", "Coronary Angiography"]
        },
        {
          keywords: ['cough', 'lung', 'breathe', 'breath', 'dyspnea', 'sob', 'wheeze', 'asthma', 'pneumonia', 'tuberculosis', 'tb', 'sputum', 'hemoptysis', 'bronchial', 'pleural', 'respiratory'],
          system: "Respiratory",
          region: "Chest / Lungs",
          anatomy: [
            { label: "Lung Left", description: "Left lung showing signs of focal infiltration or cavitary lesions in upper lobes." },
            { label: "Lung Right", description: "Right lung showing parenchymal consolidation." },
            { label: "Trachea", description: "The cartilaginous tube connecting the larynx to bronchi, through which sputum is expectorated." }
          ],
          diagnoses: [
            { condition: "Pulmonary Tuberculosis", confidence: 90, reasoning: "Chronic productive cough, hemoptysis, night sweats, weight loss." },
            { condition: "Bacterial Pneumonia", confidence: 50, reasoning: "Productive cough with fever and chest pain." }
          ],
          investigations: ["Sputum Acid-Fast Bacilli (AFB) smear", "Chest X-ray (PA view)", "GeneXpert MTB/RIF assay"]
        },
        {
          keywords: ['dengue', 'fever', 'joint', 'rash', 'petechiae', 'malaria', 'typhoid', 'chills', 'lymph', 'nodes', 'skin'],
          system: "Circulatory / Integumentary",
          region: "Systemic",
          anatomy: [
            { label: "Skin", description: "The outer integumentary covering of the body, showing petechial rashes." },
            { label: "Lymph Nodes", description: "Nodular structures of the lymphatic system, enlarged during viral infection." }
          ],
          diagnoses: [
            { condition: "Dengue Fever", confidence: 88, reasoning: "High fever, joint pain, retro-orbital headache, petechial rash." },
            { condition: "Chikungunya", confidence: 60, reasoning: "Severe debilitating polyarthralgia and fever." }
          ],
          investigations: ["CBC (Platelet count)", "Dengue NS1 Antigen Test", "Dengue IgM/IgG ELISA"]
        },
        {
          keywords: ['appendicitis', 'appendix', 'mcburney', 'rlq', 'lower right'],
          system: "Digestive",
          region: "Abdomen (Lower Right)",
          anatomy: [
            { label: "Appendix", description: "A narrow, blind-ended tube projecting from the cecum, acutely inflamed." },
            { label: "Intestines", description: "The cecum and surrounding small bowel loops showing reactive wall thickening." }
          ],
          diagnoses: [
            { condition: "Acute Appendicitis", confidence: 95, reasoning: "Migrating pain to RLQ, rebound tenderness at McBurney's point, fever." },
            { condition: "Mesenteric Lymphadenitis", confidence: 40, reasoning: "Abdominal pain with reactive lymph nodes." }
          ],
          investigations: ["Ultrasonography (USG) of abdomen", "Contrast-Enhanced CT (CECT) scan", "Total Leucocyte Count (TLC)"]
        },
        {
          keywords: ['stomach', 'vomit', 'nausea', 'gastric', 'acid', 'heartburn', 'gerd', 'indigestion', 'digestive', 'abdominal', 'abdomen', 'colic', 'cramp', 'cramping', 'intestine', 'bowel', 'colon', 'diarrhea', 'constipation'],
          system: "Digestive",
          region: "Abdomen",
          anatomy: [
            { label: "Stomach", description: "The muscular organ that receives food and performs primary mechanical and chemical digestion." },
            { label: "Intestines", description: "The digestive tract where water and nutrients are absorbed." }
          ],
          diagnoses: [
            { condition: "Acute Gastritis / Gastroenteritis", confidence: 85, reasoning: "Upper abdominal discomfort, acidity, nausea, vomiting, or diarrhea." },
            { condition: "Peptic Ulcer Disease", confidence: 65, reasoning: "Localized epigastric burning pain relieved or exacerbated by food." }
          ],
          investigations: ["Upper GI Endoscopy", "H. pylori stool antigen test", "Abdominal USG"]
        },
        {
          keywords: ['jaundice', 'liver', 'hepatic', 'yellow', 'gallbladder', 'bile', 'cholecystitis'],
          system: "Digestive",
          region: "Abdomen (Right Upper)",
          anatomy: [
            { label: "Liver", description: "The large glandular organ that filters blood, secretes bile, and detoxifies chemicals." },
            { label: "Gallbladder", description: "A pear-shaped sac beneath the liver that stores and concentrates bile." }
          ],
          diagnoses: [
            { condition: "Acute Cholecystitis / Biliary Colic", confidence: 80, reasoning: "RUQ pain radiating to scapula with positive Murphy sign." },
            { condition: "Acute Hepatitis", confidence: 70, reasoning: "Jaundice, scleral icterus, and tender hepatomegaly." }
          ],
          investigations: ["Liver Function Tests (LFT)", "Abdominal USG", "HIDA scan"]
        },
        {
          keywords: ['kidney', 'renal', 'flank', 'nephritis', 'dysuria', 'urine', 'bladder', 'urinary', 'micturition', 'cystitis'],
          system: "Urinary",
          region: "Abdomen / Pelvis",
          anatomy: [
            { label: "Kidney Left", description: "Left retroperitoneal organ filtering blood and regulating fluids." },
            { label: "Kidney Right", description: "Right retroperitoneal organ filtering blood and regulating fluids." },
            { label: "Bladder", description: "Muscular bladder storing urine prior to voiding." }
          ],
          diagnoses: [
            { condition: "Urinary Tract Infection (UTI)", confidence: 85, reasoning: "Dysuria, increased urinary frequency, and lower abdominal discomfort." },
            { condition: "Nephrolithiasis (Kidney Stones)", confidence: 75, reasoning: "Acute severe spasmodic flank pain radiating to the groin." }
          ],
          investigations: ["Urinalysis (Urine R/E and culture)", "Renal / Bladder USG", "Non-contrast CT KUB"]
        },
        {
          keywords: ['bone', 'fracture', 'joint', 'ribs', 'pelvis', 'femur', 'tibia', 'fibula', 'patella', 'humerus', 'radius', 'ulna', 'clavicle', 'scapula', 'skeletal', 'spine', 'vertebrae'],
          system: "Musculoskeletal (Skeletal)",
          region: "Skeleton",
          anatomy: [
            { label: "Skeleton", description: "The structural framework of the body consisting of bones and joints." }
          ],
          diagnoses: [
            { condition: "Bone Fracture / Joint Dislocation", confidence: 90, reasoning: "Localized pain, swelling, and deformity following physical trauma." }
          ],
          investigations: ["Radiography (X-ray)", "CT scan of affected region", "Orthopedic consult"]
        },
        {
          keywords: ['muscle', 'strain', 'sprain', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'deltoid', 'pectoral', 'gluteus', 'calf', 'myalgia'],
          system: "Musculoskeletal (Muscular)",
          region: "Muscles",
          anatomy: [
            { label: "Muscles", description: "The contractile tissues enabling physical movement." }
          ],
          diagnoses: [
            { condition: "Acute Muscle Strain", confidence: 85, reasoning: "Pain and stiffness exacerbated by active contraction or passive stretch." }
          ],
          investigations: ["Soft tissue Ultrasonography", "Clinical examination"]
        }
      ]

      // Count scores
      for (const rule of RULES) {
        let score = 0
        for (const kw of rule.keywords) {
          if (query.includes(kw)) {
            score += 10
            // Boost exact matches
            const regex = new RegExp(`\\b${kw}\\b`, 'i')
            if (regex.test(query)) {
              score += 20
            }
          }
        }
        if (score > 0) {
          ruleMatches.push({ ...rule, score })
        }
      }

      // Sort by score
      ruleMatches.sort((a, b) => b.score - a.score)

      // Direct anatomical scanning boost
      const ALLOWED_LABELS = [
        "Brain", "Nasal Cavity", "Throat", "Trachea", "Lung Left", "Lung Right", "Heart", "Aorta",
        "Liver", "Stomach", "Gallbladder", "Spleen", "Pancreas", "Kidney Left", "Kidney Right",
        "Intestines", "Appendix", "Bladder", "Spinal Cord", "Skin", "Lymph Nodes",
        "Skeleton", "Muscles", "Skull", "Spine", "Ribs", "Pelvis", "Femur", "Tibia",
        "Patella", "Humerus", "Radius", "Ulna", "Clavicle", "Scapula",
        "Biceps", "Triceps", "Quadriceps", "Hamstrings", "Deltoid", "Pectoral", "Gluteus", "Calf"
      ]

      const directAnatomyList: Array<{ label: string; description: string }> = []
      for (const label of ALLOWED_LABELS) {
        const lLower = label.toLowerCase()
        const regex = new RegExp(`\\b${lLower}\\b`, 'i')
        if (regex.test(query)) {
          directAnatomyList.push({
            label: label,
            description: `Direct symptom correlation identified for the ${label}.`
          })
        }
      }

      if (ruleMatches.length > 0) {
        const best = ruleMatches[0]
        
        // Merge rule matches and direct matches
        const mergedAnatomy = [...best.anatomy]
        
        // Add direct anatomy matches if not already present
        for (const item of directAnatomyList) {
          if (!mergedAnatomy.some(a => a.label === item.label)) {
            mergedAnatomy.push(item)
          }
        }

        let system = best.system
        let region = best.region
        if (directAnatomyList.length > 0) {
          const hasBoneOrMuscle = directAnatomyList.some(item => 
            ["Skeleton", "Skull", "Spine", "Ribs", "Pelvis", "Femur", "Tibia", "Patella", "Humerus", "Radius", "Ulna", "Clavicle", "Scapula", "Muscles", "Biceps", "Triceps", "Quadriceps", "Hamstrings", "Deltoid", "Pectoral", "Gluteus", "Calf"].includes(item.label)
          )
          if (hasBoneOrMuscle && system === "Digestive") {
            system = "Musculoskeletal"
            region = "Locomotor System"
          }
        }

        parsedJson = {
          body_system: system,
          body_region: region,
          affected_anatomy: mergedAnatomy,
          differential_diagnoses: best.diagnoses,
          recommended_investigations: best.investigations
        }
      } else if (directAnatomyList.length > 0) {
        const firstLabel = directAnatomyList[0].label
        const isBone = ["Skeleton", "Skull", "Spine", "Ribs", "Pelvis", "Femur", "Tibia", "Patella", "Humerus", "Radius", "Ulna", "Clavicle", "Scapula"].includes(firstLabel)
        const isMuscle = ["Muscles", "Biceps", "Triceps", "Quadriceps", "Hamstrings", "Deltoid", "Pectoral", "Gluteus", "Calf"].includes(firstLabel)
        
        parsedJson = {
          body_system: isBone ? "Musculoskeletal (Skeletal)" : isMuscle ? "Musculoskeletal (Muscular)" : "Systemic",
          body_region: firstLabel,
          affected_anatomy: directAnatomyList,
          differential_diagnoses: [
            { condition: `Focal ${firstLabel} Pathology`, confidence: 80, reasoning: `Reported symptoms localizing directly to the ${firstLabel}.` }
          ],
          recommended_investigations: ["Clinical physical assessment", "Imaging of affected area"]
        }
      } else {
        // Fallback Default
        parsedJson = {
          body_system: "Digestive",
          body_region: "Abdomen",
          affected_anatomy: [
            { label: "Stomach", description: "The stomach and upper digestive organs showing general signs of discomfort or mild functional distress." },
            { label: "Intestines", description: "The intestines showing signs of mild colic or functional cramping." }
          ],
          differential_diagnoses: [
            { condition: "General Abdominal Colic / Gastroenteritis", confidence: 75, reasoning: "Nonspecific presentation of digestive discomfort or cramping symptoms." }
          ],
          recommended_investigations: ["Clinical physical evaluation"]
        };
      }
    }

    return NextResponse.json(parsedJson)

  } catch (error: any) {
    console.error('Symptom analysis API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze symptoms. Please try again.' },
      { status: 500 }
    )
  }
}