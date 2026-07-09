const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
content = content.replace(/\r\n/g, '\n');

const targetAnchor = "  const [approvalStatus, setApprovalStatus] = useState<string | null>(null) // 'Approved' | 'Rejected' | 'Modified'";
const anchorIndex = content.indexOf(targetAnchor);

if (anchorIndex === -1) {
  console.error("Could not find the approvalStatus state anchor!");
  process.exit(1);
}

const beforeAnchor = content.substring(0, anchorIndex + targetAnchor.length);
const afterAnchor = content.substring(anchorIndex + targetAnchor.length);

const statesAndHandlers = `

  // Quick Symptom Entry States
  const [showSymptomForm, setShowSymptomForm] = useState(false)
  const [quickSymptoms, setQuickSymptoms] = useState('')
  const [quickSelectedComplaints, setQuickSelectedComplaints] = useState<string[]>([])
  const [quickVitals, setQuickVitals] = useState({
    bpSys: '120',
    bpDia: '80',
    hr: '75',
    spo2: '98',
    temp: '37.0'
  })

  // Sync quick forms when activePatient changes
  useEffect(() => {
    if (activePatient) {
      setQuickSymptoms(activePatient.symptoms || '')
      if (activePatient.vitals) {
        const [sys, dia] = (activePatient.vitals.bp || '120/80').split('/')
        setQuickVitals({
          bpSys: sys || '120',
          bpDia: dia || '80',
          hr: activePatient.vitals.hr || '75',
          spo2: activePatient.vitals.spo2 || '98',
          temp: activePatient.vitals.temp || '37.0'
        })
      }
      setQuickSelectedComplaints([])
      setShowSymptomForm(false)
    }
  }, [selectedPatientId, patients])

  const handleQuickAnalyze = async () => {
    const complaintsStr = quickSelectedComplaints
      .map(id => {
        const item = [
          { id: 'chest_pain', label: 'Chest Pain' },
          { id: 'dyspnea', label: 'Shortness of Breath' },
          { id: 'cephalalgia', label: 'Severe Headache' },
          { id: 'abdominal_pain', label: 'Abdominal Pain' },
          { id: 'high_fever', label: 'High Grade Fever' },
          { id: 'arthralgia', label: 'Joint/Muscle Pain' }
        ].find(c => c.id === id)
        return item ? item.label : ''
      })
      .filter(Boolean)
      .join(', ')

    const structuredSymptoms = \`[Chief Complaint: \${complaintsStr || 'None'}] [Pain Severity: 5/10] \${quickSymptoms}\`
    const structuredNotes = \`[Patient Profile: Age \${activePatient?.age || 38}, Blood Type \${activePatient?.bloodType || 'O+'}] \${activePatient?.notes || ''}\`
    
    const vitalsData = {
      temp: quickVitals.temp,
      hr: quickVitals.hr,
      spo2: quickVitals.spo2,
      bp: \`\${quickVitals.bpSys}/\${quickVitals.bpDia}\`,
      resp: activePatient?.vitals.resp || '16'
    }

    await handleAnalyzeSymptoms(structuredSymptoms, structuredNotes, activePatient?.gender || 'Female', vitalsData)
    setShowSymptomForm(false)
  }
`;

const updatedContent = beforeAnchor + statesAndHandlers + afterAnchor;
fs.writeFileSync(filePath, updatedContent.replace(/\n/g, '\r\n'), 'utf8');
console.log("Successfully added quick symptom states and handlers to dashboard.tsx!");
