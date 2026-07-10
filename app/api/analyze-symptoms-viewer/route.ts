import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// EXACT organ IDs — must match ORGANS array in page.tsx
// ─────────────────────────────────────────────────────────────────────────────
const VALID_ORGAN_IDS = [
  'brain', 'heart', 'lung_left', 'lung_right',
  'liver', 'stomach', 'kidney_left', 'kidney_right',
  'intestines', 'throat', 'trachea', 'nasal_cavity',
  'spleen', 'pancreas', 'appendix', 'bladder', 'gallbladder',
  'aorta', 'spinal_cord', 'skin', 'lymph_nodes'
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Synonym → canonical ID map
// ─────────────────────────────────────────────────────────────────────────────
const SYNONYM_MAP: Record<string, string[]> = {
  heart: ['heart'], cardiac: ['heart'], myocardium: ['heart'],
  pericardium: ['heart'], coronary: ['heart'], myocardial: ['heart'],
  ventricle: ['heart'], atrium: ['heart'], valve: ['heart'],
  aorta: ['aorta'], aortic: ['aorta'],
  vascular: ['heart', 'aorta'], cardiovascular: ['heart', 'aorta'],
  lungs: ['lung_left', 'lung_right'], lung: ['lung_left', 'lung_right'],
  lung_left: ['lung_left'], lung_right: ['lung_right'],
  pulmonary: ['lung_left', 'lung_right'], bronchi: ['lung_left', 'lung_right'],
  bronchial: ['lung_left', 'lung_right'], pleura: ['lung_left', 'lung_right'],
  pleural: ['lung_left', 'lung_right'], diaphragm: ['lung_left', 'lung_right'],
  respiratory: ['lung_left', 'lung_right', 'trachea'],
  alveolar: ['lung_left', 'lung_right'],
  trachea: ['trachea'], windpipe: ['trachea'], airway: ['trachea'],
  throat: ['throat'], pharynx: ['throat'], larynx: ['throat'],
  nasal_cavity: ['nasal_cavity'], nasal: ['nasal_cavity'],
  sinuses: ['nasal_cavity'], sinus: ['nasal_cavity'], nose: ['nasal_cavity'],
  brain: ['brain'], cerebral: ['brain'], cerebrum: ['brain'],
  cerebellum: ['brain'], meningeal: ['brain'], meninges: ['brain'],
  cranial: ['brain'], neurological: ['brain'], intracranial: ['brain'],
  brainstem: ['brain'], cortex: ['brain'],
  spinal: ['spinal_cord'], spine: ['spinal_cord'], spinal_cord: ['spinal_cord'],
  liver: ['liver'], hepatic: ['liver'], hepatitis: ['liver'],
  biliary: ['liver', 'gallbladder'], bile: ['liver', 'gallbladder'],
  gallbladder: ['gallbladder'], cholecyst: ['gallbladder'],
  kidneys: ['kidney_left', 'kidney_right'], kidney: ['kidney_left', 'kidney_right'],
  kidney_left: ['kidney_left'], kidney_right: ['kidney_right'],
  renal: ['kidney_left', 'kidney_right'], nephro: ['kidney_left', 'kidney_right'],
  ureter: ['kidney_left', 'kidney_right'],
  bladder: ['bladder'], urinary: ['kidney_left', 'kidney_right', 'bladder'],
  urethra: ['bladder'], urological: ['kidney_left', 'kidney_right', 'bladder'],
  stomach: ['stomach'], gastric: ['stomach'], gastro: ['stomach'],
  esophagus: ['throat', 'stomach'], oesophagus: ['throat', 'stomach'],
  intestines: ['intestines'], intestinal: ['intestines'],
  intestine: ['intestines'], bowel: ['intestines'], colon: ['intestines'],
  colonic: ['intestines'], rectum: ['intestines'],
  duodenum: ['stomach', 'intestines'],
  small_intestine: ['intestines'], large_intestine: ['intestines'],
  ileum: ['intestines'], jejunum: ['intestines'], sigmoid: ['intestines'],
  appendix: ['appendix'], appendicitis: ['appendix'],
  pancreas: ['pancreas'], pancreatic: ['pancreas'],
  insulin: ['pancreas'], diabetes: ['pancreas'],
  spleen: ['spleen'], splenic: ['spleen'],
  skin: ['skin'], integumentary: ['skin'], dermal: ['skin'],
  dermatitis: ['skin'], rash: ['skin'], cutaneous: ['skin'],
  lymph: ['lymph_nodes'], lymphatic: ['lymph_nodes'],
  lymph_nodes: ['lymph_nodes'], lymphoma: ['lymph_nodes'],
  lymphadenopathy: ['lymph_nodes'],
}

function normalizeOrgan(raw: string): string[] {
  const key = raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
  if (SYNONYM_MAP[key]) return SYNONYM_MAP[key]
  for (const [k, ids] of Object.entries(SYNONYM_MAP)) {
    if (key.includes(k) || k.includes(key)) return ids
  }
  if ((VALID_ORGAN_IDS as readonly string[]).includes(key)) return [key]
  return []
}

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Disease Templates — each maps symptoms to organs precisely
// ─────────────────────────────────────────────────────────────────────────────
interface ClinicalTemplate {
  name: string
  keywords: string[]          // any match triggers consideration
  requiredKeywords?: string[] // ALL must match for high confidence
  score: number               // base score for ranking
  regions: string[]
  conditions: Record<string, { condition: string; reasoning: string; severity: string }>
  diagnoses: Array<{ name: string; confidence: number; reasoning: string }>
  redFlag: boolean
}

const CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  // ── CARDIAC ──────────────────────────────────────────────────────────────
  {
    name: 'Acute MI / ACS',
    keywords: ['chest pain', 'chest pressure', 'crushing', 'retrosternal', 'stemi', 'nstemi', 'left arm', 'jaw pain', 'diaphoresis', 'sweating', 'palpitation', 'angina', 'troponin', 'ecg', 'st elevation', 'cardiac arrest'],
    requiredKeywords: ['chest'],
    score: 100,
    regions: ['heart', 'lung_left', 'lung_right', 'aorta'],
    conditions: {
      heart: { condition: 'Myocardial Infarction / Ischaemia', reasoning: 'Coronary artery occlusion causing cardiomyocyte necrosis with ST-segment changes and troponin elevation.', severity: 'Critical' },
      lung_left: { condition: 'Pulmonary Oedema (Left Heart Failure)', reasoning: 'Reduced left ventricular output causes hydrostatic fluid transudation into alveoli.', severity: 'High' },
      lung_right: { condition: 'Pulmonary Oedema (Bilateral)', reasoning: 'Bilateral lung congestion from acute cardiac decompensation and raised PCWP.', severity: 'High' },
      aorta: { condition: 'Haemodynamic Instability', reasoning: 'Reduced cardiac output causing systemic hypoperfusion via the descending aorta.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Acute STEMI (ST-Elevation Myocardial Infarction)', confidence: 96, reasoning: 'ST elevation in leads II/III/aVF with crushing retrosternal pain, diaphoresis and haemodynamic compromise is STEMI until proven otherwise.' },
      { name: 'Acute Pericarditis', confidence: 28, reasoning: 'Pleuritic positional chest pain with pericardial friction rub — may mimic ACS.' },
      { name: 'Aortic Dissection (Type A)', confidence: 22, reasoning: 'Tearing chest pain radiating to back in hypertensive patient must be excluded emergently.' },
    ],
    redFlag: true
  },
  // ── AORTIC DISSECTION ────────────────────────────────────────────────────
  {
    name: 'Aortic Dissection',
    keywords: ['tearing', 'ripping', 'dissection', 'aortic', 'back pain', 'interscapular', 'unequal pulse', 'pulse deficit', 'hypertension emergency'],
    score: 95,
    regions: ['aorta', 'heart', 'kidney_left', 'kidney_right'],
    conditions: {
      aorta: { condition: 'Acute Aortic Dissection (Intimal Tear)', reasoning: 'Tear in aortic intima creating false lumen extending from ascending to descending aorta.', severity: 'Critical' },
      heart: { condition: 'Aortic Root Involvement / Tamponade Risk', reasoning: 'Type A dissection extending to aortic root causing pericardial haemorrhage risk.', severity: 'Critical' },
      kidney_left: { condition: 'Renal Ischaemia (Left)', reasoning: 'Dissection flap occluding left renal artery ostium causing acute renal ischaemia.', severity: 'High' },
      kidney_right: { condition: 'Renal Ischaemia (Right)', reasoning: 'Right renal artery involvement causing bilateral renal hypoperfusion.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Acute Aortic Dissection (Type A — Stanford)', confidence: 92, reasoning: 'Tearing interscapular pain with unequal blood pressure and pulse deficit in hypertensive patient.' },
      { name: 'Type B Aortic Dissection', confidence: 45, reasoning: 'Descending aorta only — lower mortality but may cause mesenteric / renal ischaemia.' },
    ],
    redFlag: true
  },
  // ── PULMONARY TB ─────────────────────────────────────────────────────────
  {
    name: 'Pulmonary TB',
    keywords: ['haemoptysis', 'hemoptysis', 'blood in sputum', 'bloody sputum', 'tuberculosis', ' tb ', 'night sweat', 'weight loss', 'evening fever', 'productive cough', 'afb', 'mtb', 'contact history', 'cavitary', 'apical'],
    score: 90,
    regions: ['lung_left', 'lung_right', 'trachea', 'lymph_nodes'],
    conditions: {
      lung_left: { condition: 'Cavitary Pulmonary TB (Left)', reasoning: 'Mycobacterium tuberculosis causing caseating granulomas, cavitation and alveolar destruction in upper lobe.', severity: 'High' },
      lung_right: { condition: 'Cavitary Pulmonary TB (Right)', reasoning: 'Bilateral TB with right-sided apical predilection — highly contagious during active disease.', severity: 'High' },
      trachea: { condition: 'Endobronchial TB Spread', reasoning: 'Mycobacterial spread along the tracheobronchial tree causing endobronchial lesions and mucosal ulceration.', severity: 'Medium' },
      lymph_nodes: { condition: 'Hilar / Mediastinal Lymphadenopathy', reasoning: 'Mycobacterial seeding of mediastinal lymph nodes causing lymphadenopathy — may compress bronchi.', severity: 'Medium' },
    },
    diagnoses: [
      { name: 'Pulmonary Tuberculosis — Active (Smear +ve)', confidence: 91, reasoning: 'Productive haemoptysis, night sweats, evening fever, weight loss and TB contact history in young adult is active PTB.' },
      { name: 'Lung Carcinoma (Primary Bronchogenic)', confidence: 32, reasoning: 'Persistent haemoptysis with weight loss in smoker — CT and bronchoscopy required to exclude malignancy.' },
      { name: 'Bronchiectasis', confidence: 28, reasoning: 'Recurrent productive cough with purulent sputum and cylindrical bronchial dilation on HRCT.' },
    ],
    redFlag: false
  },
  // ── PNEUMONIA / RESPIRATORY ───────────────────────────────────────────────
  {
    name: 'Pneumonia',
    keywords: ['pneumonia', 'chest infection', 'pleurisy', 'crepitation', 'consolidation', 'productive cough', 'sputum', 'rusty sputum', 'bronchopneumonia', 'lobar pneumonia', 'breathing difficulty', 'tachypnoea'],
    score: 80,
    regions: ['lung_left', 'lung_right', 'trachea', 'lymph_nodes'],
    conditions: {
      lung_left: { condition: 'Lobar / Bronchopneumonia — Left', reasoning: 'Bacterial consolidation of left lung parenchyma with alveolar exudate impairing gas exchange.', severity: 'High' },
      lung_right: { condition: 'Lobar / Bronchopneumonia — Right', reasoning: 'Right lower lobe consolidation is most common site due to vertical bronchial anatomy.', severity: 'High' },
      trachea: { condition: 'Tracheobronchitis', reasoning: 'Upper airway inflammation from descending respiratory infection with purulent mucosal secretions.', severity: 'Medium' },
      lymph_nodes: { condition: 'Reactive Hilar Lymphadenopathy', reasoning: 'Regional lymph node activation from pulmonary bacterial antigen load.', severity: 'Low' },
    },
    diagnoses: [
      { name: 'Community-Acquired Pneumonia (S. pneumoniae)', confidence: 85, reasoning: 'Acute fever, productive rust-coloured sputum, bronchial breathing and lobar consolidation on CXR.' },
      { name: 'Atypical Pneumonia (Mycoplasma)', confidence: 45, reasoning: 'Dry cough, bilateral patchy infiltrates and milder systemic illness in younger patients.' },
      { name: 'Pulmonary TB', confidence: 30, reasoning: 'Must be excluded with AFB smear in Indian setting for any prolonged respiratory illness.' },
    ],
    redFlag: false
  },
  // ── ASTHMA / BRONCHOSPASM ─────────────────────────────────────────────────
  {
    name: 'Asthma / Bronchospasm',
    keywords: ['wheez', 'wheeze', 'wheezing', 'asthma', 'bronchospasm', 'shortness of breath', 'dyspnea', 'dyspnoea', 'breathlessness', 'bronchodilator', 'salbutamol', 'nebulizer'],
    score: 78,
    regions: ['lung_left', 'lung_right', 'trachea'],
    conditions: {
      lung_left: { condition: 'Bronchoconstriction / Hyperinflation', reasoning: 'Smooth muscle spasm causing dynamic airflow obstruction with air trapping and reduced FEV1.', severity: 'High' },
      lung_right: { condition: 'Bronchoconstriction / Hyperinflation', reasoning: 'Bilateral bronchospasm with mucus plugging increasing airway resistance on both sides.', severity: 'High' },
      trachea: { condition: 'Upper Airway Hyperresponsiveness', reasoning: 'Tracheal mucosal oedema and secretions contributing to audible wheeze.', severity: 'Medium' },
    },
    diagnoses: [
      { name: 'Acute Severe Asthma Exacerbation', confidence: 88, reasoning: 'Expiratory polyphonic wheeze, accessory muscle use, PEFR < 50% predicted — life-threatening if SpO2 < 92%.' },
      { name: 'Acute COPD Exacerbation', confidence: 55, reasoning: 'Irreversible airflow limitation with acute worsening in smoker over 40 — evidence of barrel chest.' },
      { name: 'Cardiac Asthma (LVF)', confidence: 30, reasoning: 'Nocturnal wheeze with orthopnoea from pulmonary oedema mimicking bronchospasm.' },
    ],
    redFlag: false
  },
  // ── MENINGITIS / NEUROLOGICAL ─────────────────────────────────────────────
  {
    name: 'Meningitis / Neurological Emergency',
    keywords: ['meningitis', 'stiff neck', 'neck stiffness', 'nuchal rigidity', 'photophobia', 'kernig', 'brudzinski', 'thunderclap', 'thunderclap headache', 'worst headache', 'subarachnoid', 'sah', 'encephalitis', 'papilloedema'],
    score: 98,
    regions: ['brain', 'spinal_cord'],
    conditions: {
      brain: { condition: 'Bacterial Meningitis / Subarachnoid Haemorrhage', reasoning: 'Bacterial toxins or subarachnoid blood crossing blood-brain barrier causing raised ICP and meningeal irritation.', severity: 'Critical' },
      spinal_cord: { condition: 'Spinal Meningeal Inflammation', reasoning: 'Meningitis extending to spinal meninges causing nuchal rigidity and positive Kernig sign.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Bacterial Meningitis (N. meningitidis / S. pneumoniae)', confidence: 94, reasoning: 'Fever, sudden-onset severe headache, nuchal rigidity, photophobia and Kernig sign — immediate LP and antibiotics.' },
      { name: 'Subarachnoid Haemorrhage (Berry Aneurysm Rupture)', confidence: 70, reasoning: 'Thunderclap headache — "worst of life" — with meningism requires emergency CT head and LP.' },
      { name: 'Viral (Aseptic) Meningitis', confidence: 40, reasoning: 'Milder presentation, normal CSF glucose, lymphocytic pleocytosis — usually self-limiting.' },
    ],
    redFlag: true
  },
  // ── STROKE ────────────────────────────────────────────────────────────────
  {
    name: 'Acute Stroke',
    keywords: ['stroke', 'facial droop', 'facial palsy', 'arm weakness', 'slurred speech', 'aphasia', 'hemiplegia', 'hemiparesis', 'sudden weakness', 'tpa', 'thrombolysis', 'hemorrhagic', 'ischaemic stroke', 'fast positive', 'ct head'],
    score: 97,
    regions: ['brain', 'aorta'],
    conditions: {
      brain: { condition: 'Acute Cerebral Ischaemia / Infarction', reasoning: 'Thromboembolic occlusion of cerebral artery causing ischaemic penumbra and neuronal death within 4.5 hours.', severity: 'Critical' },
      aorta: { condition: 'Aortic / Cardioembolic Source', reasoning: 'Aortic plaque or left ventricular thrombus as cardioembolic source of cerebral embolism.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Acute Ischaemic Stroke (MCA / ACA Territory)', confidence: 93, reasoning: 'FAST-positive with sudden unilateral weakness, facial droop, and aphasia — immediate CT and thrombolysis within 4.5h window.' },
      { name: 'Haemorrhagic Stroke (ICH)', confidence: 35, reasoning: 'Intracerebral haemorrhage from hypertensive vessel rupture — worse prognosis, CT shows hyperdense lesion.' },
      { name: 'TIA (Transient Ischaemic Attack)', confidence: 25, reasoning: 'Symptoms resolving within 24h — ABCD2 score for stroke risk stratification.' },
    ],
    redFlag: true
  },
  // ── APPENDICITIS ──────────────────────────────────────────────────────────
  {
    name: 'Appendicitis',
    keywords: ['appendix', 'appendicitis', 'right iliac fossa', 'rif', 'mcburney', 'rebound tenderness', 'rovsing', 'periumbilical pain', 'right lower quadrant', 'guarding', 'rigidity', 'alvarado'],
    score: 92,
    regions: ['appendix', 'intestines'],
    conditions: {
      appendix: { condition: 'Acute Suppurative Appendicitis (Perforation Risk)', reasoning: 'Faecolith obstructing appendiceal lumen causing bacterial overgrowth, mural ischaemia and peritoneal spillage risk.', severity: 'Critical' },
      intestines: { condition: 'Peritoneal Irritation / Secondary Ileus', reasoning: 'Adjacent caecal and peritoneal inflammation causing guarding, rebound tenderness and reflex ileus.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Acute Appendicitis (Alvarado Score ≥ 7)', confidence: 94, reasoning: 'Classic migration of periumbilical pain to RIF with Rovsing sign, fever and elevated WCC — surgical emergency.' },
      { name: 'Ovarian Torsion / Ectopic Pregnancy (if female)', confidence: 45, reasoning: 'Gynaecological emergencies mimic appendicitis in women of childbearing age — β-hCG and transvaginal USS required.' },
      { name: 'Mesenteric Adenitis', confidence: 30, reasoning: 'Inflamed mesenteric lymph nodes mimicking appendicitis — usually preceded by URTI in children.' },
    ],
    redFlag: true
  },
  // ── GALLBLADDER / BILIARY ─────────────────────────────────────────────────
  {
    name: 'Acute Cholecystitis / Biliary Colic',
    keywords: ['gallbladder', 'cholecystitis', 'murphy', 'biliary colic', 'gallstone', 'right upper quadrant', 'right hypochondrium', 'post-prandial', 'fatty meal', 'bile', 'choledocholithiasis', 'obstructive', 'bilirubin', 'cholangi', 'ercp', 'hida'],
    score: 88,
    regions: ['gallbladder', 'liver', 'stomach'],
    conditions: {
      gallbladder: { condition: 'Acute Cholecystitis / Cholelithiasis', reasoning: 'Gallstone impaction at Hartmann pouch causing distension, bacterial superinfection and Murphy sign.', severity: 'High' },
      liver: { condition: 'Obstructive Biliary Hepatopathy', reasoning: 'Elevated bilirubin and ALP from common bile duct stone or Mirizzi syndrome causing hepatic back-pressure.', severity: 'Medium' },
      stomach: { condition: 'Epigastric Dysmotility', reasoning: 'Biliary colic causing referred nausea, vomiting and gastric stasis from vagal stimulation.', severity: 'Low' },
    },
    diagnoses: [
      { name: 'Acute Calculous Cholecystitis', confidence: 90, reasoning: 'Right upper quadrant pain post-fatty meal with positive Murphy sign, fever, elevated WCC and gallstones on USS.' },
      { name: 'Common Bile Duct Stone (Choledocholithiasis)', confidence: 55, reasoning: 'Obstructive jaundice with dilated CBD on USS and deranged LFTs — ERCP indicated.' },
      { name: 'Acute Pancreatitis (Gallstone)', confidence: 40, reasoning: 'Gallstone impaction at ampulla of Vater causing pancreatic outflow obstruction and autodigestion.' },
    ],
    redFlag: false
  },
  // ── PANCREATITIS ──────────────────────────────────────────────────────────
  {
    name: 'Acute Pancreatitis',
    keywords: ['pancreat', 'amylase', 'lipase', 'epigastric', 'band-like pain', 'radiates to back', 'alcoholic', 'alcohol', 'cullen', 'grey turner', 'pseudocyst', 'necrotising'],
    score: 90,
    regions: ['pancreas', 'stomach', 'liver', 'kidney_left', 'kidney_right'],
    conditions: {
      pancreas: { condition: 'Acute Pancreatic Autodigestion / Necrosis', reasoning: 'Activated trypsin causing autodigestion of pancreatic parenchyma with peripancreatic fat necrosis and haemorrhage.', severity: 'Critical' },
      stomach: { condition: 'Gastric Outlet Obstruction / Ileus', reasoning: 'Peripancreatic inflammation causing gastric and duodenal oedema with nausea and vomiting.', severity: 'Medium' },
      liver: { condition: 'Secondary Hepatic Inflammation', reasoning: 'Obstructive jaundice from ampullary stone and systemic inflammatory cytokine release elevating liver enzymes.', severity: 'Medium' },
      kidney_left: { condition: 'Acute Kidney Injury (Systemic Shock)', reasoning: 'Severe pancreatitis causing SIRS and haemodynamic compromise reducing renal perfusion.', severity: 'Medium' },
      kidney_right: { condition: 'Acute Kidney Injury (Systemic Shock)', reasoning: 'Bilateral renal impairment from reduced cardiac output in severe pancreatitis with third-space losses.', severity: 'Medium' },
    },
    diagnoses: [
      { name: 'Acute Biliary Pancreatitis (Gallstone)', confidence: 85, reasoning: 'Epigastric pain radiating to back, vomiting, amylase >3× ULN with gallstones on USS.' },
      { name: 'Alcoholic Pancreatitis', confidence: 75, reasoning: 'Recurrent pancreatitis in heavy drinker with elevated lipase and alcohol binge history.' },
      { name: 'Severe Acute Pancreatitis (APACHE II ≥ 8)', confidence: 40, reasoning: 'Cullen / Grey-Turner signs, organ failure, necrosis on CECT — ICU admission required.' },
    ],
    redFlag: true
  },
  // ── LIVER / HEPATITIS ─────────────────────────────────────────────────────
  {
    name: 'Hepatitis / Liver Disease',
    keywords: ['jaundice', 'icterus', 'yellow', 'hepatitis', 'liver', 'dark urine', 'pale stool', 'clay stool', 'hepatomegaly', 'alt', 'ast', 'alp', 'bilirubin', 'viral hepatitis', 'cirrhosis', 'hepatic'],
    score: 82,
    regions: ['liver', 'gallbladder', 'spleen'],
    conditions: {
      liver: { condition: 'Hepatocellular Inflammation / Cholestasis', reasoning: 'Elevated bilirubin from hepatocyte damage or intrahepatic bile duct obstruction with ALT/AST rise.', severity: 'High' },
      gallbladder: { condition: 'Biliary Obstruction / Cholangitis', reasoning: 'Biliary stasis from intrahepatic cholestasis or extrahepatic obstruction causing gallbladder distension.', severity: 'Medium' },
      spleen: { condition: 'Congestive Splenomegaly (Portal Hypertension)', reasoning: 'Portal hypertension from hepatic parenchymal disease causing splenic venous engorgement and hypersplenism.', severity: 'Medium' },
    },
    diagnoses: [
      { name: 'Acute Viral Hepatitis B / E', confidence: 82, reasoning: 'Deep jaundice, tender hepatomegaly, dark urine, pale stools and elevated transaminases >10× ULN — LFT + serology.' },
      { name: 'Obstructive Jaundice (Choledocholithiasis / Carcinoma)', confidence: 55, reasoning: 'Progressive painless jaundice with ALP > ALT and dilated CBD on USS — ERCP / MRCP required.' },
      { name: 'Autoimmune Hepatitis', confidence: 25, reasoning: 'Young woman with hypergammaglobulinaemia, ANA/ASMA positive — treat with corticosteroids.' },
    ],
    redFlag: false
  },
  // ── DENGUE ────────────────────────────────────────────────────────────────
  {
    name: 'Dengue Fever',
    keywords: ['dengue', 'retro-orbital', 'retro orbital', 'orbital pain', 'thrombocytopenia', 'thrombocytopaenia', 'platelet', 'petechiae', 'rash', 'breakbone', 'ns1', 'dengue ns1', 'dengue antibody', 'haematocrit', 'dengue shock'],
    score: 88,
    regions: ['brain', 'liver', 'spleen', 'skin', 'lymph_nodes'],
    conditions: {
      brain: { condition: 'Dengue Encephalopathy / Retro-orbital Neuralgia', reasoning: 'Viral viraemia causing severe retro-orbital pain, myalgia, and encephalopathy from intracranial pressure elevation.', severity: 'High' },
      liver: { condition: 'Dengue Hepatitis / Hepatomegaly', reasoning: 'Dengue virus causing hepatic inflammation with elevated transaminases and hepatomegaly in 80% of cases.', severity: 'Medium' },
      spleen: { condition: 'Splenomegaly / Platelet Sequestration', reasoning: 'Splenic enlargement from platelet sequestration and reticuloendothelial activation during viraemia.', severity: 'Medium' },
      skin: { condition: 'Petechial / Maculopapular Rash (Thrombocytopaenia)', reasoning: 'Platelet-mediated capillary fragility causing petechiae, ecchymoses and risk of haemorrhagic dengue.', severity: 'High' },
      lymph_nodes: { condition: 'Generalised Reactive Lymphadenopathy', reasoning: 'Viral immune activation causing lymph node hyperplasia and generalised lymphadenopathy.', severity: 'Low' },
    },
    diagnoses: [
      { name: 'Dengue Haemorrhagic Fever (WHO Grade III)', confidence: 90, reasoning: 'Continuous fever, retro-orbital pain, severe myalgia, platelets < 100,000, positive NS1 antigen in endemic region.' },
      { name: 'Dengue Shock Syndrome (Grade IV)', confidence: 40, reasoning: 'Hypotension, narrow pulse pressure, rapid haematocrit rise with thrombocytopaenia — ICU management.' },
      { name: 'Chikungunya Fever', confidence: 35, reasoning: 'Severe joint pain distinguishes Chikungunya from Dengue — both are Aedes aegypti transmitted.' },
    ],
    redFlag: false
  },
  // ── MALARIA ───────────────────────────────────────────────────────────────
  {
    name: 'Malaria',
    keywords: ['malaria', 'plasmodium', 'falciparum', 'vivax', 'tertian fever', 'quartan fever', 'splenomegaly', 'haemolysis', 'rdp kit', 'smear', 'parasite', 'anopheles', 'rigors', 'chills'],
    score: 86,
    regions: ['brain', 'liver', 'spleen', 'kidney_left', 'kidney_right'],
    conditions: {
      brain: { condition: 'Cerebral Malaria (P. falciparum)', reasoning: 'Parasitised erythrocytes sequestering in cerebral microvasculature causing coma, seizures and raised ICP.', severity: 'Critical' },
      liver: { condition: 'Malarial Hepatitis / Jaundice', reasoning: 'Parasitic haemolysis causing unconjugated hyperbilirubinaemia and hepatic inflammation.', severity: 'High' },
      spleen: { condition: 'Massive Splenomegaly (Malarial)', reasoning: 'Reticuloendothelial hyperplasia from chronic parasite clearance causing massive splenic enlargement.', severity: 'High' },
      kidney_left: { condition: 'Blackwater Fever / AKI', reasoning: 'Massive intravascular haemolysis causing haemoglobinuria and acute renal tubular injury.', severity: 'High' },
      kidney_right: { condition: 'Acute Tubular Necrosis', reasoning: 'Bilateral renal failure from haemoglobin precipitation in tubules and hypovolaemia in severe malaria.', severity: 'High' },
    },
    diagnoses: [
      { name: 'P. falciparum Malaria (Complicated)', confidence: 88, reasoning: 'Periodic high fever with rigors, splenomegaly, haemolysis and positive RDT/thick smear in endemic area.' },
      { name: 'P. vivax Malaria (Benign Tertian)', confidence: 55, reasoning: 'Every 48-hour paroxysms with hepatosplenomegaly — less severe but prone to relapse from hypnozoites.' },
      { name: 'Typhoid Fever', confidence: 30, reasoning: 'Continuous fever with hepatosplenomegaly and leukopenia — co-infection common in tropics.' },
    ],
    redFlag: true
  },
  // ── TYPHOID ───────────────────────────────────────────────────────────────
  {
    name: 'Typhoid / Enteric Fever',
    keywords: ['typhoid', 'enteric fever', 'salmonella', 'step-ladder fever', 'rose spots', 'relative bradycardia', 'widal', 'blood culture', 'typhidot', 'diarrhoea fever', 'splenomegaly fever'],
    score: 86,
    regions: ['intestines', 'liver', 'spleen', 'lymph_nodes'],
    conditions: {
      intestines: { condition: "Peyer Patch Ulceration (Perforation Risk)", reasoning: "Salmonella typhi proliferating in Peyer patches of terminal ileum — ulceration risk in 2nd week, perforation in 3rd week.", severity: 'Critical' },
      liver: { condition: 'Typhoid Hepatitis / Hepatomegaly', reasoning: 'Systemic salmonella bacteraemia causing hepatic inflammation, tender hepatomegaly and elevated transaminases.', severity: 'High' },
      spleen: { condition: 'Splenomegaly (Enteric)', reasoning: 'Reactive splenic enlargement from reticuloendothelial system activation during bacteraemic phase.', severity: 'Medium' },
      lymph_nodes: { condition: 'Mesenteric Lymphadenopathy', reasoning: "Salmonella seeding mesenteric lymph nodes producing lymphoid hyperplasia and tenderness.", severity: 'Medium' },
    },
    diagnoses: [
      { name: 'Enteric Fever — Typhoid (S. typhi)', confidence: 87, reasoning: 'Step-ladder fever 1–3 weeks with hepatosplenomegaly, rose spots and relative bradycardia — blood culture gold standard.' },
      { name: 'Paratyphoid (S. paratyphi A/B)', confidence: 45, reasoning: 'Milder enteric fever with shorter duration — clinically indistinguishable from typhoid.' },
      { name: 'Malaria', confidence: 30, reasoning: 'Co-endemic febrile illness — differentiate by smear/RDT vs Widal/blood culture.' },
    ],
    redFlag: true
  },
  // ── UTI / RENAL ───────────────────────────────────────────────────────────
  {
    name: 'UTI / Pyelonephritis',
    keywords: ['dysuria', 'burning urination', 'burning micturition', 'frequency', 'urgency', 'pyelonephritis', 'uti', 'flank pain', 'loin pain', 'costovertebral', 'haematuria', 'proteinuria', 'nitrites', 'urinalysis', 'kidney stone', 'renal colic', 'ureteric colic', 'calculus'],
    score: 84,
    regions: ['kidney_left', 'kidney_right', 'bladder'],
    conditions: {
      kidney_left: { condition: 'Acute Pyelonephritis / Renal Calculus', reasoning: 'Ascending UTI reaching renal pelvis causing nephric angle tenderness, fever and parenchymal oedema.', severity: 'High' },
      kidney_right: { condition: 'Bilateral Renal Involvement / Calculus', reasoning: 'UTI may be bilateral, especially in female patients — both kidneys require USS assessment.', severity: 'Medium' },
      bladder: { condition: 'Haemorrhagic Cystitis / Bladder Calculus', reasoning: 'Lower urinary tract infection causing mucosal inflammation with dysuria, frequency and suprapubic pain.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Acute Pyelonephritis (E. coli)', confidence: 86, reasoning: 'Fever, dysuria, CVA tenderness, pyuria and bacteriuria — IV ceftriaxone until oral switch.' },
      { name: 'Ureteric / Renal Calculus (Urolithiasis)', confidence: 60, reasoning: 'Colicky unilateral flank pain radiating to groin with haematuria — KUB X-ray and CT urogram.' },
      { name: 'Vesicoureteric Reflux with Recurrent UTI', confidence: 25, reasoning: 'Recurrent febrile UTI in young women — MCU and DMSA scan for reflux nephropathy.' },
    ],
    redFlag: false
  },
  // ── SKIN / DERMATOLOGICAL ─────────────────────────────────────────────────
  {
    name: 'Skin / Dermatological',
    keywords: ['skin rash', 'dermatitis', 'eczema', 'psoriasis', 'urticaria', 'hives', 'cellulitis', 'erythema', 'pruritus', 'itching', 'blisters', 'vesicles', 'bullae', 'wound', 'abscess', 'necrotising fasciitis', 'petechiae', 'purpura'],
    score: 70,
    regions: ['skin', 'lymph_nodes'],
    conditions: {
      skin: { condition: 'Cutaneous Inflammation / Infection', reasoning: 'Dermal and epidermal involvement from infection, allergen, or autoimmune process causing barrier breakdown.', severity: 'Medium' },
      lymph_nodes: { condition: 'Regional Lymphadenopathy (Reactive)', reasoning: 'Draining lymph nodes enlarge in response to cutaneous infection or inflammatory process.', severity: 'Low' },
    },
    diagnoses: [
      { name: 'Cellulitis (Group A Streptococcus / S. aureus)', confidence: 78, reasoning: 'Unilateral erythematous, warm, tender plaque with fever — penicillin + flucloxacillin.' },
      { name: 'Necrotising Fasciitis (Surgical Emergency)', confidence: 30, reasoning: 'Rapidly spreading skin necrosis with crepitus — surgical debridement + broad-spectrum antibiotics.' },
      { name: 'Anaphylaxis / Urticaria', confidence: 25, reasoning: 'Generalised urticaria with angioedema and systemic features — immediate IM adrenaline.' },
    ],
    redFlag: false
  },
  // ── NASAL / ENT ───────────────────────────────────────────────────────────
  {
    name: 'ENT / Nasal Condition',
    keywords: ['rhinitis', 'sinusitis', 'nasal congestion', 'runny nose', 'blocked nose', 'allergic rhinitis', 'epistaxis', 'nosebleed', 'nasal polyp', 'postnasal drip', 'cold', 'upper respiratory tract', 'urti', 'common cold'],
    score: 65,
    regions: ['nasal_cavity', 'throat', 'trachea'],
    conditions: {
      nasal_cavity: { condition: 'Rhinosinusitis / Allergic Rhinitis', reasoning: 'Nasal mucosal inflammation from infection or allergen causing congestion, rhinorrhoea and postnasal drip.', severity: 'Low' },
      throat: { condition: 'Pharyngitis / Post-nasal Drip', reasoning: 'Descending secretions causing pharyngeal irritation and throat discomfort.', severity: 'Low' },
      trachea: { condition: 'Tracheitis (Upper Airway Extension)', reasoning: 'Viral URTI extending inferiorly to the trachea causing subglottic inflammation and dry cough.', severity: 'Low' },
    },
    diagnoses: [
      { name: 'Acute Viral Rhinosinusitis (URTI)', confidence: 82, reasoning: 'Nasal congestion, clear rhinorrhoea, sore throat and low-grade fever — self-limiting viral illness.' },
      { name: 'Allergic Rhinitis (Perennial / Seasonal)', confidence: 65, reasoning: 'IgE-mediated nasal mucosal inflammation with sneezing, watery discharge and nasal eosinophilia.' },
      { name: 'Acute Bacterial Sinusitis', confidence: 35, reasoning: 'Persistent purulent rhinorrhoea >10 days with facial pain and tenderness — augmentin 7-day course.' },
    ],
    redFlag: false
  },
  // ── THROAT / EPIGLOTTITIS ─────────────────────────────────────────────────
  {
    name: 'Throat / Airway',
    keywords: ['sore throat', 'tonsillitis', 'tonsillar', 'pharyngitis', 'epiglottitis', 'stridor', 'dysphagia', 'odynophagia', 'drooling', 'quinsy', 'peritonsillar abscess', 'painful swallowing', 'muffled voice', 'hot potato voice'],
    score: 75,
    regions: ['throat', 'trachea', 'lymph_nodes'],
    conditions: {
      throat: { condition: 'Acute Tonsillo-pharyngitis / Epiglottitis', reasoning: 'Bacterial or viral pharyngeal infection causing mucosal oedema, exudate and risk of airway compromise.', severity: 'High' },
      trachea: { condition: 'Subglottic / Supraglottic Oedema', reasoning: 'Laryngeal oedema from epiglottitis or Ludwig angina may extend to trachea causing stridor.', severity: 'High' },
      lymph_nodes: { condition: 'Cervical Lymphadenopathy', reasoning: 'Anterior cervical lymph nodes enlarge in response to tonsillopharyngeal bacterial infection.', severity: 'Low' },
    },
    diagnoses: [
      { name: 'Acute Streptococcal Tonsillitis (Group A Strep)', confidence: 80, reasoning: 'Exudative tonsillitis with fever, cervical lymphadenopathy and Centor score ≥ 3 — penicillin V 10 days.' },
      { name: 'Peritonsillar Abscess (Quinsy)', confidence: 45, reasoning: 'Trismus, muffled voice, uvular deviation and unilateral tonsillar bulge — I&D urgent.' },
      { name: 'Acute Epiglottitis (H. influenzae / GAS)', confidence: 30, reasoning: 'Drooling, stridor, tripod posture — do NOT use tongue depressor — airway emergency, call anaesthetics.' },
    ],
    redFlag: false
  },
  // ── SPINAL / BACK ─────────────────────────────────────────────────────────
  {
    name: 'Spinal / Back Pain',
    keywords: ['back pain', 'spinal', 'herniated disc', 'disc prolapse', 'sciatica', 'radiculopathy', 'paraplegia', 'cauda equina', 'spinal cord compression', 'vertebral fracture', 'lumbar', 'cervical myelopathy', 'epidural'],
    score: 80,
    regions: ['spinal_cord'],
    conditions: {
      spinal_cord: { condition: 'Spinal Cord Compression / Myelopathy', reasoning: 'Cord compression from herniated disc, fracture or epidural abscess causing myelopathic signs and motor deficit.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Acute Disc Herniation with Radiculopathy (L4/L5 or L5/S1)', confidence: 82, reasoning: 'Lancinating sciatica with dermatomal sensory loss and positive straight leg raise — MRI spine diagnostic.' },
      { name: 'Cauda Equina Syndrome (Surgical Emergency)', confidence: 40, reasoning: 'Bilateral leg weakness, saddle anaesthesia and bladder/bowel dysfunction — MRI and neurosurgery within 6 hours.' },
      { name: 'Vertebral Osteomyelitis / Epidural Abscess', confidence: 25, reasoning: 'Localised spinal tenderness with fever in IV drug user — MRI shows cord oedema and paraspinal collection.' },
    ],
    redFlag: false
  },
  // ── LYMPHOMA / HAEMATOLOGICAL ─────────────────────────────────────────────
  {
    name: 'Lymphoma / Haematological',
    keywords: ['lymphadenopathy', 'lymphoma', 'hodgkin', 'non-hodgkin', 'leukaemia', 'lymph node swelling', 'neck lump', 'axillary lump', 'b symptoms', 'night sweats weight loss fever', 'bone marrow', 'lymphocytosis'],
    score: 75,
    regions: ['lymph_nodes', 'spleen', 'liver'],
    conditions: {
      lymph_nodes: { condition: 'Malignant Lymphadenopathy (Lymphoma)', reasoning: 'Lymphoid tissue proliferation causing firm, painless, rubbery lymph node enlargement in multiple nodal groups.', severity: 'High' },
      spleen: { condition: 'Splenomegaly (Lymphomatous Infiltration)', reasoning: 'Lymphoma infiltrating splenic parenchyma causing massive splenomegaly and hypersplenism.', severity: 'Medium' },
      liver: { condition: 'Hepatic Infiltration / Hepatomegaly', reasoning: 'Lymphoma spreading to hepatic parenchyma causing hepatomegaly and abnormal LFTs.', severity: 'Medium' },
    },
    diagnoses: [
      { name: 'Hodgkin Lymphoma (Classic — Nodular Sclerosis)', confidence: 80, reasoning: 'Painless cervical lymphadenopathy with B symptoms (fever, drenching sweats, >10% weight loss) in young adult.' },
      { name: 'Non-Hodgkin Lymphoma (Diffuse Large B-Cell)', confidence: 65, reasoning: 'Rapidly enlarging nodal mass with extranodal involvement — aggressive — RCHOP chemotherapy.' },
      { name: 'Infectious Mononucleosis (EBV)', confidence: 40, reasoning: 'Reactive lymphadenopathy in young adult with pharyngitis, splenomegaly and atypical lymphocytosis — Monospot test.' },
    ],
    redFlag: false
  },
  // ── DIABETIC EMERGENCY ────────────────────────────────────────────────────
  {
    name: 'Diabetic Emergency',
    keywords: ['diabetic ketoacidosis', 'dka', 'hyperosmolar', 'honk', 'ketones', 'fruity breath', 'kussmaul', 'hyperglycaemia', 'blood glucose', 'insulin deficiency', 'type 1 diabetes', 'type 2 diabetes', 'hypoglycaemia', 'hypoglycemia'],
    score: 85,
    regions: ['pancreas', 'brain', 'kidney_left', 'kidney_right'],
    conditions: {
      pancreas: { condition: 'Absolute / Relative Insulin Deficiency (DKA)', reasoning: 'Beta-cell failure or insulin resistance causing uncontrolled lipolysis, ketogenesis and metabolic acidosis.', severity: 'Critical' },
      brain: { condition: 'Cerebral Oedema / Encephalopathy', reasoning: 'DKA cerebral oedema from rapid osmolality shifts — commonest cause of DKA death in children.', severity: 'High' },
      kidney_left: { condition: 'Acute Diabetic Nephropathy / AKI', reasoning: 'Dehydration and osmotic diuresis causing prerenal AKI and acute-on-chronic diabetic nephropathy.', severity: 'High' },
      kidney_right: { condition: 'Acute Tubular Injury (Dehydration)', reasoning: 'Bilateral renal impairment from severe dehydration and ketoacidosis-induced haemodynamic compromise.', severity: 'High' },
    },
    diagnoses: [
      { name: 'Diabetic Ketoacidosis (DKA)', confidence: 90, reasoning: 'Blood glucose >11 mmol/L, pH < 7.35, ketones >3 mmol/L, Kussmaul breathing and fruity breath — IV insulin + fluids.' },
      { name: 'Hyperosmolar Hyperglycaemic State (HHS)', confidence: 40, reasoning: 'Elderly T2DM with glucose > 33.3 mmol/L, hyperosmolarity > 320 mOsm/kg without significant ketosis.' },
      { name: 'Severe Hypoglycaemia', confidence: 25, reasoning: 'Glucose < 3 mmol/L with sweating, tremor, confusion — IV dextrose 50% immediately.' },
    ],
    redFlag: true
  },
  // ── PEPTIC ULCER ──────────────────────────────────────────────────────────
  {
    name: 'Peptic Ulcer / GERD',
    keywords: ['peptic ulcer', 'gerd', 'reflux', 'heartburn', 'regurgitation', 'dyspepsia', 'h. pylori', 'helicobacter', 'melena', 'haematemesis', 'coffee ground vomiting', 'upper gi bleed', 'epigastric burning', 'antacid'],
    score: 78,
    regions: ['stomach', 'intestines', 'throat'],
    conditions: {
      stomach:    { condition: 'Peptic Ulcer / Gastritis / GERD', reasoning: 'Mucosal breakdown from H. pylori or NSAID use causing ulceration with epigastric burning pain and haematemesis.', severity: 'High' },
      intestines: { condition: 'Duodenal Ulceration / Upper GI Bleeding', reasoning: 'Duodenal ulcer causing melaena from slow blood loss or acute massive haemorrhage with haematemesis.', severity: 'High' },
      throat:     { condition: 'Oesophagitis / Acid Reflux', reasoning: 'Gastric acid reflux causing oesophageal mucosal damage, heartburn, waterbrash and regurgitation.', severity: 'Low' },
    },
    diagnoses: [
      { name: 'H. pylori Duodenal Ulcer (Active Bleeding)', confidence: 84, reasoning: 'Coffee-ground vomiting, melaena, epigastric tenderness and positive CLO test — OGD + triple eradication therapy.' },
      { name: 'Oesophageal Varices (Liver Cirrhosis)', confidence: 40, reasoning: 'Massive haematemesis of bright red blood in cirrhotic patient — urgent endoscopy and variceal banding.' },
      { name: 'Mallory-Weiss Tear', confidence: 25, reasoning: 'Post-forceful vomiting haematemesis — linear mucosal tear at GOJ on OGD.' },
    ],
    redFlag: false
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Scoring engine — scores every clinical template against the symptom text
// ─────────────────────────────────────────────────────────────────────────────
function scoreTemplate(template: ClinicalTemplate, text: string): number {
  let hits = 0
  for (const kw of template.keywords) {
    if (text.includes(kw)) hits++
  }
  if (hits === 0) return 0
  if (template.requiredKeywords) {
    for (const rk of template.requiredKeywords) {
      if (!text.includes(rk)) return 0
    }
  }
  return template.score * (0.5 + (hits / template.keywords.length) * 0.5)
}

// ─────────────────────────────────────────────────────────────────────────────
// Local clinical template stub — always available, zero API cost
// ─────────────────────────────────────────────────────────────────────────────
function runSmartStub(symptoms: string, severity: string) {
  const text = symptoms.toLowerCase()
  const scored = CLINICAL_TEMPLATES
    .map(t => ({ template: t, score: scoreTemplate(t, text) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return NextResponse.json({
      affectedRegions: ['stomach', 'intestines'],
      possibleConditions: [
        { name: 'Acute Gastroenteritis', confidence: 70, reasoning: 'Abdominal discomfort suggesting GI inflammation.' },
        { name: 'Functional Dyspepsia',  confidence: 40, reasoning: 'Chronic epigastric discomfort without alarm features.' },
      ],
      organConditions: {
        stomach:    { condition: 'Gastric Mucosal Irritation', reasoning: 'Infectious gastric inflammation.', severity },
        intestines: { condition: 'Intestinal Hypermotility',  reasoning: 'Enteric infection causing hypersecretion.', severity },
      },
      redFlag: false, model: 'stub',
    })
  }

  const best = scored[0].template
  const conditions: Record<string, any> = {}
  for (const [id, cond] of Object.entries(best.conditions)) {
    conditions[id] = {
      ...cond,
      severity: cond.severity === 'Critical' || cond.severity === 'High' ? cond.severity : severity,
    }
  }

  if (scored.length > 1 && scored[1].score > scored[0].score * 0.65) {
    const secondary = scored[1].template
    for (const [id, cond] of Object.entries(secondary.conditions)) {
      if (!conditions[id]) conditions[id] = { ...cond, severity: cond.severity === 'Critical' ? 'Critical' : 'Medium' }
    }
    for (const id of secondary.regions) {
      if (!best.regions.includes(id as any)) best.regions.push(id as any)
    }
  }

  return NextResponse.json({
    affectedRegions:    [...new Set(best.regions)],
    possibleConditions: best.diagnoses,
    organConditions:    conditions,
    redFlag:            best.redFlag,
    model:              'stub',
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// HuggingFace Serverless Inference API (Llama-3-8B as MedGemma alternative)
//
// SETUP:
//   1. Visit https://huggingface.co/settings/tokens
//   2. Create Fine-grained token with "Make calls to the serverless Inference API"
//   3. Add to .env.local:  HUGGINGFACE_API_TOKEN=hf_XXXXXXXXXXXXXXXX
// ─────────────────────────────────────────────────────────────────────────────
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions'

function buildClinicalPrompts(age: any, sex: any, duration: any, severity: any, symptoms: string) {
  const ORGAN_LIST = VALID_ORGAN_IDS.join('", "')

  const systemPrompt = `You are an expert clinical anatomist API.
You are embedded in a 3D anatomy visualisation system used by clinicians.

TASK: Analyse patient symptoms and identify ALL anatomically affected organs with structured differentials.

RULES:
1. "affectedRegions" MUST only contain IDs from: ["${ORGAN_LIST}"]
2. BILATERAL: lungs/pulmonary -> both "lung_left" AND "lung_right"; kidneys/renal -> both "kidney_left" AND "kidney_right"
3. COMPREHENSIVE: include secondary organs (heart failure->lungs; hepatitis->spleen; meningitis->brain+spinal_cord)
4. "organConditions": every region needs "condition", "reasoning", "severity" (Critical/High/Medium/Low)
5. "possibleConditions": top 3 with "name", "confidence" (0-100), "reasoning"
6. "redFlag": true only if immediately life-threatening
7. Prioritise Indian conditions: Dengue, Malaria, Typhoid, TB, ACS, UTI, Appendicitis
8. Return ONLY raw valid JSON. No markdown, no preamble.`

  const userPrompt = `PATIENT:
Age: ${age || 'Not specified'} | Sex: ${sex || 'Not specified'} | Duration: ${duration || 'Not specified'} | Severity: ${severity || 'Not specified'}
SYMPTOMS: ${symptoms}
Return raw JSON.`

  return { systemPrompt, userPrompt }
}

async function callHuggingFace(systemPrompt: string, userPrompt: string, hfToken: string): Promise<any | null> {
  try {
    const response = await fetch(HF_ROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:       'meta-llama/Meta-Llama-3-8B-Instruct',
        messages:    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens:  1800,
        temperature: 0.05,
        stream:      false,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      console.error(`[HF Llama] HTTP ${response.status}:`, await response.text())
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return null

    const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1)
    const parsed = JSON.parse(jsonStr)
    parsed._model = 'llama-3-8b-hf'
    return parsed
  } catch (err: any) {
    console.error('[HF Llama] Network/timeout:', err?.message)
    return null
  }
}

function shapeAIResponse(parsed: any, severity: string): NextResponse | null {
  if (!Array.isArray(parsed?.affectedRegions) || !Array.isArray(parsed?.possibleConditions)) return null

  const normalizedRegions: string[] = []
  for (const raw of parsed.affectedRegions as string[]) {
    for (const id of normalizeOrgan(raw)) {
      if (!normalizedRegions.includes(id)) normalizedRegions.push(id)
    }
  }
  if (normalizedRegions.length === 0) return null

  const normalizedConditions: Record<string, any> = {}
  if (parsed.organConditions) {
    for (const [rawKey, val] of Object.entries(parsed.organConditions)) {
      for (const id of normalizeOrgan(rawKey)) {
        if (!normalizedConditions[id]) normalizedConditions[id] = val
      }
    }
  }

  const primary = parsed.possibleConditions?.[0]
  for (const id of normalizedRegions) {
    if (!normalizedConditions[id]) {
      normalizedConditions[id] = {
        condition: primary?.name     || 'Clinically Affected',
        reasoning: primary?.reasoning || 'Organ implicated from symptom cluster.',
        severity:  severity || 'High',
      }
    }
  }

  return NextResponse.json({
    affectedRegions:    normalizedRegions,
    possibleConditions: (parsed.possibleConditions as any[]).slice(0, 3),
    organConditions:    normalizedConditions,
    redFlag:            !!parsed.redFlag,
    model:              parsed._model ?? 'unknown',
  })
}

async function callMedGemma(systemPrompt: string, userPrompt: string, hfToken: string): Promise<any | null> {
  let res: Response
  try {
    res = await fetch(MEDGEMMA_URL, {
      method: 'POST',
      headers: {
        'Authorization':    `Bearer ${hfToken}`,
        'Content-Type':     'application/json',
        'X-Wait-For-Model': 'true',
      },
      body: JSON.stringify({
        model:       'google/medgemma-27b-it',
        messages:    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens:  1800,
        temperature: 0.05,
        stream:      false,
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (err: any) {
    console.error('[MedGemma] Network/timeout:', err?.message)
    return null
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error(`[MedGemma] HTTP ${res.status}:`, txt.slice(0, 300))
    return null
  }

  const data    = await res.json().catch(() => null)
  const content = ((data?.choices?.[0]?.message?.content) ?? '').trim() as string
  if (!content) { console.error('[MedGemma] Empty response'); return null }
  console.log('[MedGemma] Preview:', content.slice(0, 400))

  const m = content.match(/\{[\s\S]*\}/)
  if (!m) { console.error('[MedGemma] No JSON found'); return null }
  try   { const p = JSON.parse(m[0]); p._model = 'medgemma-27b-it'; return p }
  catch { console.error('[MedGemma] JSON parse error'); return null }
}

async function callGPT4o(systemPrompt: string, userPrompt: string, apiKey: string): Promise<any | null> {
  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:           'gpt-4o',
        messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature:     0.05,
        max_tokens:      2000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err: any) {
    console.error('[GPT-4o] Network error:', err?.message)
    return null
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error(`[GPT-4o] HTTP ${res.status}:`, txt.slice(0, 300))
    return null
  }

  const data    = await res.json().catch(() => null)
  const content = ((data?.choices?.[0]?.message?.content) ?? '').trim() as string
  if (!content) return null
  console.log('[GPT-4o] Preview:', content.slice(0, 400))

  try   { const p = JSON.parse(content);   p._model = 'gpt-4o'; return p }
  catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) return null
    try { const p = JSON.parse(m[0]); p._model = 'gpt-4o'; return p } catch { return null }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/analyze-symptoms-viewer
//
// Priority chain:
//   1. MedGemma-27b-it  (HuggingFace Inference API)   <- PRIMARY medical AI
//   2. GPT-4o           (OpenAI API)                   <- FALLBACK 1
//   3. runSmartStub     (local clinical templates)     <- FALLBACK 2 (always works)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { age, sex, duration, severity, symptoms } = await req.json()

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 })
    }

    const hfToken = process.env.HUGGINGFACE_API_TOKEN
    const oaiKey  = process.env.OPENAI_API_KEY
    const { systemPrompt, userPrompt } = buildClinicalPrompts(age, sex, duration, severity, symptoms)

    // 1. Llama-3 via HuggingFace Inference API
    if (hfToken) {
      console.log('[API] Trying Llama-3-8B...')
      const parsed = await callHuggingFace(systemPrompt, userPrompt, hfToken)
      if (parsed) {
        const shaped = shapeAIResponse(parsed, severity || 'High')
        if (shaped) { console.log('[API] Llama-3 succeeded'); return shaped }
      }
      console.warn('[API] Llama-3 unavailable — trying next provider')
    } else {
      console.warn('[API] No HUGGINGFACE_API_TOKEN — Llama-3 skipped')
      console.warn('[API] Add HUGGINGFACE_API_TOKEN=hf_XXX to .env.local to enable Llama-3')
    }

    // 2. GPT-4o via OpenAI
    if (oaiKey) {
      console.log('[API] Trying GPT-4o...')
      const parsed = await callGPT4o(systemPrompt, userPrompt, oaiKey)
      if (parsed) {
        const shaped = shapeAIResponse(parsed, severity || 'High')
        if (shaped) { console.log('[API] GPT-4o succeeded'); return shaped }
      }
      console.warn('[API] GPT-4o unavailable — falling back to stub')
    } else {
      console.warn('[API] No OPENAI_API_KEY — GPT-4o skipped')
    }

    // 3. Local clinical template stub
    console.log('[API] Running local clinical stub...')
    return runSmartStub(symptoms, severity || 'High')

  } catch (error: any) {
    console.error('[API] Unexpected error:', error?.message)
    try {
      const body = await (req as any).clone().json()
      return runSmartStub(body?.symptoms || '', body?.severity || 'High')
    } catch {
      return NextResponse.json({ error: 'Clinical analysis failed.' }, { status: 500 })
    }
  }
}