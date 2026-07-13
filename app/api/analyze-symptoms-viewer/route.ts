import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

const localAI = createOpenAI({
  baseURL: 'http://127.0.0.1:1234/v1',
  apiKey: 'not-needed',
  compatibility: 'compatible'
})

const VALID_MESH_IDS = [
  'brain', 'heart', 'lung_left', 'lung_right',
  'liver', 'stomach', 'kidney_left', 'kidney_right',
  'intestines', 'throat', 'trachea', 'nasal_cavity',
  'spleen', 'pancreas', 'appendix', 'bladder', 'gallbladder',
  'aorta', 'spinal_cord', 'skin', 'lymph_nodes',
  'skeleton', 'muscles'
] as const

const AnalysisSchema = z.object({
  body_system: z.string().describe('The primary body system affected (e.g. Musculoskeletal, Cardiovascular).'),
  body_region: z.string().describe('The specific body region affected (e.g. Right Knee, Chest).'),
  affected_anatomy: z.array(z.object({
    label: z.string(),
    mesh_id: z.string().nullable()
  })).describe('List of affected anatomical structures with their corresponding mesh IDs.'),
  systems_to_enable: z.array(z.string()).describe('List of 3D system layers to enable (e.g. skeletal, muscular, respiratory).'),
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

    // Dynamically fetch the active model from LM Studio to prevent Just-In-Time loading errors
    let activeModelId = 'local-model'
    try {
      const modelsRes = await fetch('http://127.0.0.1:1234/v1/models')
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json()
        if (modelsData.data && modelsData.data.length > 0) {
          // Find the first model that isn't an embedding model
          const textModel = modelsData.data.find((m: any) => !m.id.includes('embed'))
          if (textModel) activeModelId = textModel.id
        }
      }
    } catch (e) {
      console.warn("Could not fetch models from local server")
    }

    const result = await generateText({
      model: localAI(activeModelId),
      prompt: `You are an advanced AI Clinical Decision Support System.
Analyze the following patient presentation:
Age: ${age}
Sex: ${sex}
Duration: ${duration}
Reported Severity: ${severity}
Symptoms: ${symptoms}

CRITICAL RULES:
1. Analyze ONLY the CURRENT patient symptoms.
2. Classify the affected body system first.
3. Identify ALL relevant anatomical structures affected (not just one).
4. Map EACH structure to the correct GLB mesh ID from this strict list: ${VALID_MESH_IDS.join(', ')}.
5. Display ONLY anatomical names as labels in "affected_anatomy" (e.g., Patella, ACL, Meniscus, Femur, Tibia). NEVER display pathological findings such as "Intestinal Distress" or "Bronchoconstriction".
6. If you cannot confidently identify the anatomy or map it to a mesh, return "Unable to determine" for the label and null for the mesh_id. Do NOT guess.
7. Inform the frontend which 3D systems need to be enabled to view these meshes (e.g., "skeletal", "muscular", "respiratory", "digestive", "nervous", "cardiovascular", "integumentary", "lymphatic").
8. Generate clinically relevant Differential Diagnoses based on the symptoms, assigning a confidence score (0-100) and clinical reasoning for each.
9. Recommend appropriate investigations based on the suspected conditions.
10. YOU MUST OUTPUT YOUR RESPONSE AS A SINGLE, VALID JSON OBJECT.
11. DO NOT add any conversational text like "Okay, I understand" or "Here is the analysis".
12. IMPORTANT: Do not group everything under "Skeleton". Map specific structures like ACL, MCL, Meniscus, Patellar Tendon, Cartilage, and Ligaments individually as separate entries in affected_anatomy.

REQUIRED JSON FORMAT:
{
  "body_system": "Musculoskeletal",
  "body_region": "Right Knee",
  "affected_anatomy": [
    {
      "label": "Patella",
      "mesh_id": "skeleton"
    },
    {
      "label": "Meniscus",
      "mesh_id": "skeleton"
    }
  ],
  "systems_to_enable": ["skeletal", "muscular"],
  "differential_diagnoses": [
    {
      "condition": "Knee Sprain",
      "confidence": 85,
      "reasoning": "Swelling and pain post-trauma."
    }
  ],
  "recommended_investigations": ["X-ray", "MRI"]
}`
    });

    let jsonString = result.text.trim();
    // Strip markdown blocks if they exist
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonString = match[1];
    }
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Failed to parse JSON output from the model. The model output was not valid JSON.");
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