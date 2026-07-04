# Sprint 3: Ayurvedic Assessment

**Status**: 🚀 Planning (Ready to Build)  
**Previous Tag**: `clinical-core-sprint1-code` (checkpoint, stable)  
**Scope**: Ayurvedic assessment data only (Prakriti, Vikriti, Nadi, Doshas, Agni, Ojas, Satva)  
**Out of Scope**: Diagnosis, Prescription, Treatment planning (Sprint 4+)

---

## Objective

Capture Ayurvedic clinical assessment data for each visit. Doctor records constitutional and current imbalance information along with clinical diagnostic findings from Ayurvedic frameworks.

---

## Scope (Locked)

### ✅ In Sprint 3
- **Prakriti** (original constitution): Vata, Pitta, Kapha, or combinations
- **Vikriti** (current imbalance/disease state): Vata, Pitta, Kapha, or combinations
- **Nadi Pariksha** (pulse assessment): Pulse quality/rhythm description
- **Dashavidha Pariksha** (10 diagnostic methods): Select/describe findings
  - Prakriti (constitution)
  - Vikriti (disease state)
  - Sara (tissue quality)
  - Samhanana (body structure)
  - Pramana (body measurements)
  - Satmya (dietary compatibility)
  - Satva (mental capacity)
  - Ahara (digestion/appetite)
  - Vyayama (exercise tolerance)
  - Nidra (sleep quality)
- **Ashtavidha Pariksha** (8-fold examination):
  - Nadi (pulse)
  - Mala (elimination)
  - Mutra (urine)
  - Jivha (tongue)
  - Shabda (voice)
  - Sparsha (touch/skin)
  - Drk (eyes)
  - Akriti (body shape)
- **Agni** (digestive fire): Level assessment (Mandagni, Samagni, Teekshagni, Vishamagni)
- **Ojas** (vital essence): Level assessment (High, Normal, Low)
- **Satva** (mental clarity): Level assessment (High, Normal, Low)
- **General Notes**: Free-text observations
- **Assessment Status**: DRAFT, FINALIZED (same immutability rules as Sprint 2)

### ❌ Out of Sprint 3
- Diagnosis/condition names (Sprint 4)
- Treatment recommendations (Sprint 4)
- Medication prescription (Sprint 4)
- Panchakarma planning (Sprint 5)
- Therapy sessions (Sprint 5)
- Multi-assessment per visit (one assessment per visit, like consultation)

### 🔒 Do Not Change
- Visit table (frozen)
- Vitals table (frozen)
- Consultation table (frozen)
- Timeline logic (only add new event type)
- Reception check-in (frozen)
- Doctor queue (frozen)

---

## Data Model

### New Table: `emr_ayurvedic_assessment`

```sql
CREATE TABLE emr_ayurvedic_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  assessment_status emr_assessment_status DEFAULT 'DRAFT',
  
  -- Constitution & Imbalance
  prakriti TEXT,                 -- Vata/Pitta/Kapha or combination
  vikriti TEXT,                  -- Vata/Pitta/Kapha or combination
  
  -- Nadi Pariksha
  nadi_description TEXT,         -- Pulse quality, rhythm, observations
  
  -- Dashavidha Pariksha (10-fold examination)
  sara_assessment TEXT,          -- Tissue quality assessment
  samhanana_assessment TEXT,     -- Body structure assessment
  pramana_assessment TEXT,       -- Body measurements assessment
  satmya_assessment TEXT,        -- Dietary compatibility assessment
  satva_assessment_level TEXT,   -- High/Normal/Low mental capacity
  ahara_assessment TEXT,         -- Digestion and appetite assessment
  vyayama_assessment TEXT,       -- Exercise tolerance assessment
  nidra_assessment TEXT,         -- Sleep quality assessment
  
  -- Ashtavidha Pariksha (8-fold examination)
  nadi_examination TEXT,         -- Pulse examination findings
  mala_examination TEXT,         -- Elimination (bowel) findings
  mutra_examination TEXT,        -- Urine examination findings
  jivha_examination TEXT,        -- Tongue examination findings
  shabda_examination TEXT,       -- Voice/sound examination findings
  sparsha_examination TEXT,      -- Touch/skin examination findings
  drk_examination TEXT,          -- Eye examination findings
  akriti_examination TEXT,       -- Body shape/form examination findings
  
  -- Functional Assessments
  agni_assessment TEXT,          -- Mandagni/Samagni/Teekshagni/Vishamagni
  ojas_level TEXT,               -- High/Normal/Low vital essence
  
  -- General Observations
  general_notes TEXT,            -- Free-text clinical observations
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  CONSTRAINT check_assessment_not_empty CHECK (
    prakriti IS NOT NULL OR
    vikriti IS NOT NULL OR
    nadi_description IS NOT NULL
  )
);
```

### New Enum: `emr_assessment_status`

```sql
CREATE TYPE emr_assessment_status AS ENUM ('DRAFT', 'FINALIZED');
```

### Indexes

```sql
CREATE INDEX idx_emr_ayurvedic_visit ON emr_ayurvedic_assessment(visit_uuid);
CREATE INDEX idx_emr_ayurvedic_doctor ON emr_ayurvedic_assessment(doctor_uuid);
CREATE INDEX idx_emr_ayurvedic_status ON emr_ayurvedic_assessment(assessment_status);
CREATE INDEX idx_emr_ayurvedic_created ON emr_ayurvedic_assessment(created_at DESC);
```

### RLS Policies

Same pattern as Sprint 2:
- Doctors can view/edit own assessments
- Reception can view only
- Admin can view/edit all

### Timeline Integration

When assessment finalized:
```sql
INSERT INTO emr_visit_timeline (
  visit_uuid, event_type, title, description, actor_uuid, metadata
) VALUES (
  assessment.visit_uuid,
  'AYURVEDIC_ASSESSMENT_COMPLETED',
  'Ayurvedic Assessment Completed',
  'Doctor completed Ayurvedic assessment',
  actor_uuid,
  jsonb_build_object('assessment_id', assessment.id)
);
```

---

## API Endpoints

### Create Assessment

**POST** `/api/emr/visits/[visitId]/assessment/ayurvedic`

Request:
```json
{
  "prakriti": "Vata-Pitta",
  "vikriti": "Vata",
  "nadi_description": "Vata pulse, irregular rhythm",
  "sara_assessment": "Good tissue quality",
  "agni_assessment": "Mandagni",
  "ojas_level": "Normal",
  "general_notes": "Patient shows signs of Vata imbalance"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "visit_uuid": "uuid",
    "assessment_status": "DRAFT",
    "prakriti": "Vata-Pitta",
    "vikriti": "Vata",
    ...
    "complete": false
  }
}
```

### Get Assessment

**GET** `/api/emr/visits/[visitId]/assessment/ayurvedic`

### Update Assessment

**PUT** `/api/emr/visits/[visitId]/assessment/ayurvedic`

Same request format as create, with optional `assessment_status` field.

### List Assessments (for Doctor)

**GET** `/api/emr/assessments?doctor_uuid=uuid&status=DRAFT`

---

## Backend Implementation

### `lib/emr/ayurvedic-assessment.service.ts`

```typescript
export interface AyurvedicAssessmentRequest {
  prakriti?: string;
  vikriti?: string;
  nadi_description?: string;
  sara_assessment?: string;
  // ... other fields
  assessment_status?: 'DRAFT' | 'FINALIZED';
}

export class AyurvedicAssessmentService {
  constructor(private client: SupabaseClient) {}
  
  async createAssessment(
    visitUuid: string,
    doctorUuid: string,
    req: AyurvedicAssessmentRequest
  ): Promise<AssessmentResponse>
  
  async getAssessment(visitUuid: string): Promise<AssessmentResponse | null>
  
  async updateAssessment(
    visitUuid: string,
    doctorUuid: string,
    req: AyurvedicAssessmentRequest
  ): Promise<AssessmentResponse>
  
  async listDoctorAssessments(
    doctorUuid: string,
    status?: 'DRAFT' | 'FINALIZED'
  ): Promise<AssessmentResponse[]>
}
```

---

## Frontend Pages

### Assessment Form

**Path**: `/app/doctor/assessment/ayurvedic/[visitId]/page.tsx`

**Features**:
- Prakriti dropdown (Vata, Pitta, Kapha, Vata-Pitta, etc.)
- Vikriti dropdown
- Nadi description textarea
- Dashavidha assessment fields (10 sections)
- Ashtavidha examination fields (8 sections)
- Agni dropdown (4 levels)
- Ojas dropdown (High/Normal/Low)
- General notes textarea
- Save as Draft
- Finalize button
- Assessment completeness indicator
- Back to visit link

### Assessments List

**Path**: `/app/doctor/assessments/ayurvedic/page.tsx`

**Features**:
- Summary cards (Total, Draft, Finalized)
- Filter buttons (ALL, DRAFT, FINALIZED)
- List with patient info
- Status badges
- Click to open assessment

---

## Acceptance Criteria

### Code Complete ✅
- [ ] Migration idempotent
- [ ] Service with 4 methods
- [ ] 3 API endpoints
- [ ] 2 frontend pages
- [ ] TypeScript zero errors
- [ ] Build passes

### Runtime Verification ⏳
- [ ] Database migration deployed
- [ ] Create assessment via API
- [ ] Get assessment (verify DRAFT)
- [ ] Update assessment (partial updates)
- [ ] Finalize assessment (trigger logs event)
- [ ] Cannot edit finalized (API rejects)
- [ ] Frontend blocks edits when finalized
- [ ] UI form loads data correctly
- [ ] List page shows assessments
- [ ] Doctor ownership enforced
- [ ] Timeline event logged exactly once

### Sign-Off
- [ ] All tests pass
- [ ] No bugs found
- [ ] Tag: `git tag clinical-core-sprint3`
- [ ] Frozen

---

## Constraints

✅ **One Assessment Per Visit**: UNIQUE(visit_uuid)  
✅ **Immutable After Finalization**: Cannot edit FINALIZED  
✅ **Doctor Ownership**: Only creator can edit  
✅ **At Least One Field**: CHECK constraint  
✅ **Timeline Integration**: Auto-log AYURVEDIC_ASSESSMENT_COMPLETED  
✅ **Links to Visit Anchor**: No duplicate data  

---

## Out of Scope (Explicit Non-Goals)

❌ Diagnosis based on assessment (Sprint 4)  
❌ Prescription generation (Sprint 4)  
❌ Treatment recommendations (Sprint 4)  
❌ Panchakarma planning (Sprint 5)  
❌ Assessment templates  
❌ Multi-assessment per visit  
❌ Assessment versioning  

---

## Timeline

- **Code Writing**: ~3-4 hours
- **Build Verification**: ~15 minutes
- **Runtime Testing**: ~1-2 hours
- **Total**: ~5 hours

---

## Implementation Order

1. **Database Migration** (30 min)
   - Create table, enum, indexes, RLS, trigger
   - Idempotent, safe to re-run

2. **Backend Service** (60 min)
   - 4 methods (create, get, update, list)
   - Full TypeScript typing
   - Error handling

3. **API Routes** (30 min)
   - POST, GET, PUT endpoints
   - Auth checks

4. **Frontend: Form Page** (90 min)
   - Load existing or create new
   - All fields and dropdowns
   - Save draft / Finalize logic
   - Disable when finalized

5. **Frontend: List Page** (60 min)
   - Summary cards
   - Filters
   - Clickable rows

6. **Build & Verify** (45 min)
   - npm run build
   - Run 11 runtime tests
   - Fix bugs if any

---

## Next Steps After Sprint 3 Sign-Off

1. Tag: `git tag clinical-core-sprint3`
2. Freeze Sprint 3 code
3. Begin Sprint 4: Diagnosis & Prescription
4. Link diagnosis to Visit + Assessment anchor

