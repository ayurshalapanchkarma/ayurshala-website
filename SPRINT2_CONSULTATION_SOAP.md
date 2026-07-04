# Sprint 2: Consultation & SOAP Notes

**Status**: 🚀 Development Starting  
**Sprint 1 Tag**: `clinical-core-sprint1-code` ✅ (checkpoint created)  
**Scope**: Consultation record with SOAP notes, linked to Visit  
**Out of Scope**: Diagnosis, Prescription, Panchakarma (Sprints 4, 5)  

---

## Objective

Add clinical consultation records to existing visits. Doctors capture patient history (Subjective), clinical findings (Objective), clinical reasoning (Assessment), and treatment plan outline (Plan). Each consultation links to a single visit and can be edited before finalization.

---

## Scope (Locked)

### ✅ In Sprint 2
- Consultation record (linked to `emr_visit.uuid`)
- SOAP notes (4 fields)
- Chief complaint (already in visit, referenced here)
- Clinical examination findings
- Doctor notes / additional observations
- Consultation status (DRAFT, FINALIZED)
- Save/edit consultation
- Consultation history view
- Doctor consultation UI
- API endpoints (create, read, update, list)

### ❌ Out of Sprint 2
- Diagnosis (Sprint 4)
- Prescription (Sprint 4)
- Panchakarma treatment (Sprint 5)
- Follow-up scheduling (Sprint 6)
- Vitals interpretation / clinical intelligence
- Referrals or specialist notes

### 🔒 Do Not Change
- Visit table or endpoints (frozen)
- Vitals table or endpoints (frozen)
- Timeline logic or events (frozen)
- Reception check-in flow (frozen)
- Doctor queue (frozen)

---

## Data Model

### New Table: `emr_consultation`

```sql
CREATE TABLE emr_consultation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  consultation_status emr_consultation_status DEFAULT 'DRAFT',
  
  -- Chief complaint (reference to visit data)
  chief_complaint TEXT,
  
  -- SOAP Notes
  subjective TEXT,           -- Patient history, symptoms duration, etc.
  objective TEXT,            -- Clinical findings, examination results
  assessment TEXT,           -- Clinical reasoning, findings summary
  plan TEXT,                 -- Initial treatment outline
  
  -- Clinical examination
  clinical_examination TEXT, -- Physical exam findings, observations
  
  -- Doctor notes
  additional_notes TEXT,     -- Extra observations, flags, concerns
  
  -- Metadata
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  
  CONSTRAINT check_soap_not_empty CHECK (
    subjective IS NOT NULL OR
    objective IS NOT NULL OR
    assessment IS NOT NULL OR
    plan IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_emr_consultation_visit ON emr_consultation(visit_uuid);
CREATE INDEX idx_emr_consultation_doctor ON emr_consultation(doctor_uuid);
CREATE INDEX idx_emr_consultation_status ON emr_consultation(consultation_status);
CREATE INDEX idx_emr_consultation_created ON emr_consultation(created_at DESC);

-- RLS Policies
ALTER TABLE emr_consultation ENABLE ROW LEVEL SECURITY;

-- Doctors can view/edit their own consultations
CREATE POLICY "doctor_view_own_consultation" ON emr_consultation
  FOR SELECT USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "doctor_edit_own_consultation" ON emr_consultation
  FOR UPDATE USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Reception can view only
CREATE POLICY "reception_view_consultation" ON emr_consultation
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('RECEPTION', 'ADMIN'))
  );

-- Admins can do anything
CREATE POLICY "admin_all_consultation" ON emr_consultation
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
```

### New Enum: `emr_consultation_status`

```sql
CREATE TYPE emr_consultation_status AS ENUM ('DRAFT', 'FINALIZED');
```

### Timeline Integration

When consultation is finalized, auto-log to `emr_visit_timeline`:

```sql
CREATE OR REPLACE FUNCTION emr_trg_consultation_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultation_status = 'FINALIZED' AND OLD.consultation_status = 'DRAFT' THEN
    INSERT INTO emr_visit_timeline (
      visit_uuid, event_type, title, description, actor_uuid, metadata
    ) VALUES (
      NEW.visit_uuid,
      'CONSULTATION_COMPLETED',
      'Consultation Completed',
      'Doctor ' || (SELECT name FROM profiles WHERE id = NEW.doctor_uuid LIMIT 1) || ' completed consultation',
      NEW.updated_by,
      jsonb_build_object(
        'consultation_id', NEW.id,
        'soap_status', CASE 
          WHEN NEW.subjective IS NOT NULL THEN 'S' ELSE '' END ||
          CASE WHEN NEW.objective IS NOT NULL THEN 'O' ELSE '' END ||
          CASE WHEN NEW.assessment IS NOT NULL THEN 'A' ELSE '' END ||
          CASE WHEN NEW.plan IS NOT NULL THEN 'P' ELSE '' END
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emr_consultation_status_changed
  AFTER UPDATE ON emr_consultation
  FOR EACH ROW
  EXECUTE FUNCTION emr_trg_consultation_finalized();
```

---

## API Endpoints

### Create Consultation

**POST** `/api/emr/visits/[visitId]/consultation`

Request:
```json
{
  "subjective": "Patient reports persistent cough for 2 weeks, worse in mornings",
  "objective": "Chest examination reveals mild wheezing on left side",
  "assessment": "Probable upper respiratory infection with mild bronchospasm",
  "plan": "Prescribe bronchodilator, warm liquids, rest for 3-4 days",
  "clinical_examination": "Temp 98.4F, BP 120/80, slight wheeze on auscultation",
  "additional_notes": "Patient allergic to penicillin—note for prescription"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "visit_uuid": "uuid",
    "consultation_status": "DRAFT",
    "chief_complaint": "Persistent cough",
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "...",
    "clinical_examination": "...",
    "additional_notes": "...",
    "doctor_uuid": "uuid",
    "created_at": "2026-07-05T00:30:00Z"
  }
}
```

### Get Consultation

**GET** `/api/emr/visits/[visitId]/consultation`

Response: Same as create (single consultation for visit)

### Update Consultation

**PUT** `/api/emr/visits/[visitId]/consultation`

Request:
```json
{
  "subjective": "Updated subjective...",
  "objective": "Updated objective...",
  "assessment": "Updated assessment...",
  "plan": "Updated plan...",
  "clinical_examination": "Updated examination...",
  "additional_notes": "Updated notes...",
  "consultation_status": "FINALIZED"
}
```

Response: Updated consultation object

### List Consultations for Doctor

**GET** `/api/emr/visits?queue_type=doctor_consultations&doctor_uuid=uuid`

Response:
```json
{
  "success": true,
  "data": [
    {
      "visit_number": "VIS-20260705-0001",
      "patient_name": "Raj Kumar",
      "consultation_status": "DRAFT",
      "created_at": "2026-07-05T00:30:00Z",
      "soap_complete": false
    },
    ...
  ]
}
```

---

## Backend Implementation

### `lib/emr/consultation.service.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export interface ConsultationRequest {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  clinical_examination?: string;
  additional_notes?: string;
  consultation_status?: 'DRAFT' | 'FINALIZED';
}

export interface ConsultationResponse {
  id: string;
  visit_uuid: string;
  consultation_status: 'DRAFT' | 'FINALIZED';
  chief_complaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  clinical_examination?: string;
  additional_notes?: string;
  doctor_uuid: string;
  created_at: string;
  updated_at: string;
  soap_complete: boolean;
}

export class ConsultationService {
  constructor(private client: SupabaseClient) {}

  async createConsultation(
    visitUuid: string,
    doctorUuid: string,
    req: ConsultationRequest
  ): Promise<ConsultationResponse> {
    const { data: visit, error: visitError } = await this.client
      .from('emr_visit')
      .select('uuid, chief_complaint, patient_uuid')
      .eq('uuid', visitUuid)
      .single();

    if (visitError || !visit) {
      throw new Error(`Visit not found: ${visitUuid}`);
    }

    const { data, error } = await this.client
      .from('emr_consultation')
      .insert({
        visit_uuid: visitUuid,
        doctor_uuid: doctorUuid,
        chief_complaint: visit.chief_complaint,
        subjective: req.subjective || null,
        objective: req.objective || null,
        assessment: req.assessment || null,
        plan: req.plan || null,
        clinical_examination: req.clinical_examination || null,
        additional_notes: req.additional_notes || null,
        consultation_status: 'DRAFT',
        created_by: doctorUuid,
        updated_by: doctorUuid,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create consultation: ${error.message}`);
    }

    return this.formatResponse(data);
  }

  async getConsultation(visitUuid: string): Promise<ConsultationResponse | null> {
    const { data, error } = await this.client
      .from('emr_consultation')
      .select('*')
      .eq('visit_uuid', visitUuid)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new visits)
      throw new Error(`Failed to fetch consultation: ${error.message}`);
    }

    return data ? this.formatResponse(data) : null;
  }

  async updateConsultation(
    visitUuid: string,
    doctorUuid: string,
    req: ConsultationRequest
  ): Promise<ConsultationResponse> {
    const existingConsultation = await this.getConsultation(visitUuid);

    if (!existingConsultation) {
      throw new Error(`Consultation not found for visit: ${visitUuid}`);
    }

    if (existingConsultation.doctor_uuid !== doctorUuid) {
      throw new Error('Only the doctor who created this consultation can edit it');
    }

    if (existingConsultation.consultation_status === 'FINALIZED') {
      throw new Error('Cannot edit finalized consultation');
    }

    const { data, error } = await this.client
      .from('emr_consultation')
      .update({
        subjective: req.subjective ?? existingConsultation.subjective,
        objective: req.objective ?? existingConsultation.objective,
        assessment: req.assessment ?? existingConsultation.assessment,
        plan: req.plan ?? existingConsultation.plan,
        clinical_examination: req.clinical_examination ?? existingConsultation.clinical_examination,
        additional_notes: req.additional_notes ?? existingConsultation.additional_notes,
        consultation_status: req.consultation_status ?? existingConsultation.consultation_status,
        updated_at: new Date().toISOString(),
        updated_by: doctorUuid,
      })
      .eq('visit_uuid', visitUuid)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update consultation: ${error.message}`);
    }

    return this.formatResponse(data);
  }

  private formatResponse(data: any): ConsultationResponse {
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      consultation_status: data.consultation_status,
      chief_complaint: data.chief_complaint,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      clinical_examination: data.clinical_examination,
      additional_notes: data.additional_notes,
      doctor_uuid: data.doctor_uuid,
      created_at: data.created_at,
      updated_at: data.updated_at,
      soap_complete: Boolean(
        data.subjective && data.objective && data.assessment && data.plan
      ),
    };
  }
}
```

---

## Frontend Pages

### `/app/doctor/consultation/[visitId]/page.tsx`

**Purpose**: Doctor enters and edits SOAP notes for a visit

**Features**:
- Load existing consultation (if any)
- 4 SOAP textarea fields
- Clinical examination field
- Additional notes field
- Save as DRAFT button
- Finalize button (moves to FINALIZED status)
- Auto-save indicator
- Back to queue link

### `/app/doctor/consultations/page.tsx`

**Purpose**: List all consultations for the logged-in doctor

**Features**:
- Table of patient visits with consultation status
- Filter by DRAFT / FINALIZED
- Click to open consultation
- Summary cards (total, draft, finalized)

---

## Database Migration File

**File**: `migrations/sprint2_consultation_soap.sql`

```sql
-- Sprint 2: Consultation & SOAP Notes

-- Add consultation status enum if not exists
DO $$ BEGIN
  CREATE TYPE emr_consultation_status AS ENUM ('DRAFT', 'FINALIZED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create consultation table
CREATE TABLE IF NOT EXISTS emr_consultation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID NOT NULL UNIQUE REFERENCES emr_visit(uuid) ON DELETE CASCADE,
  consultation_status emr_consultation_status DEFAULT 'DRAFT',
  chief_complaint TEXT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  clinical_examination TEXT,
  additional_notes TEXT,
  doctor_uuid UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT check_soap_not_empty CHECK (
    subjective IS NOT NULL OR
    objective IS NOT NULL OR
    assessment IS NOT NULL OR
    plan IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_emr_consultation_visit ON emr_consultation(visit_uuid);
CREATE INDEX idx_emr_consultation_doctor ON emr_consultation(doctor_uuid);
CREATE INDEX idx_emr_consultation_status ON emr_consultation(consultation_status);
CREATE INDEX idx_emr_consultation_created ON emr_consultation(created_at DESC);

-- RLS
ALTER TABLE emr_consultation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_view_own_consultation" ON emr_consultation
  FOR SELECT USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "doctor_edit_own_consultation" ON emr_consultation
  FOR UPDATE USING (
    doctor_uuid = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "reception_view_consultation" ON emr_consultation
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('RECEPTION', 'ADMIN'))
  );

-- Timeline trigger
CREATE OR REPLACE FUNCTION emr_trg_consultation_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultation_status = 'FINALIZED' AND OLD.consultation_status = 'DRAFT' THEN
    INSERT INTO emr_visit_timeline (
      visit_uuid, event_type, title, description, actor_uuid, metadata
    ) VALUES (
      NEW.visit_uuid,
      'CONSULTATION_COMPLETED',
      'Consultation Completed',
      'Consultation finalized',
      NEW.updated_by,
      jsonb_build_object('consultation_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emr_consultation_status_changed
  AFTER UPDATE ON emr_consultation
  FOR EACH ROW
  EXECUTE FUNCTION emr_trg_consultation_finalized();
```

---

## Acceptance Criteria

### Code Complete ✅
- [ ] Migration file written and idempotent
- [ ] ConsultationService implemented with 3 methods
- [ ] 3 API endpoints built (create, get, update)
- [ ] 2 frontend pages built
- [ ] TypeScript zero errors
- [ ] Build passes (`npm run build`)

### Runtime Verification ⏳
- [ ] Database migration deployed
- [ ] Create consultation via API
- [ ] Get consultation (verify DRAFT status)
- [ ] Update consultation with SOAP notes
- [ ] Finalize consultation (trigger logs timeline event)
- [ ] Doctor consultation page loads data
- [ ] Doctor consultations list page shows visits
- [ ] Cannot edit finalized consultation
- [ ] Doctor cannot edit another doctor's consultation

### Sign-Off
- [ ] All tests pass
- [ ] No bugs found
- [ ] Documentation complete
- [ ] Tag: `git tag clinical-core-sprint2`
- [ ] Frozen: No more changes except bug fixes

---

## Key Constraints

1. **One Consultation Per Visit**: `UNIQUE(visit_uuid)` in table
2. **Cannot Edit Finalized**: Logic prevents updates to FINALIZED status
3. **Only Original Doctor Can Edit**: `doctor_uuid` check in service layer
4. **SOAP Not All Required**: At least one SOAP field must be present (CHECK constraint)
5. **No Diagnosis Yet**: Sprint 2 only captures initial assessment, not diagnosis
6. **Timeline Integration**: CONSULTATION_COMPLETED event auto-logged

---

## Integration with Sprint 1

- ✅ Uses `emr_visit.uuid` anchor (no changes to Visit)
- ✅ Links to `emr_visit_timeline` (new CONSULTATION_COMPLETED event type)
- ✅ Doctor from Visit record (no new user table)
- ✅ RLS consistent with Visit security model

---

## Out of Scope (Explicit Non-Goals)

❌ Prescription generation (Sprint 4)  
❌ Diagnosis recording (Sprint 4)  
❌ Panchakarma planning (Sprint 5)  
❌ Follow-up scheduling (Sprint 6)  
❌ Consultation templates or shortcuts  
❌ Multi-consultation per visit  
❌ Consultation versioning or audit trail  
❌ Consultation approval workflow  

---

## Timeline

- **Code Writing**: ~2-3 hours
- **Build Verification**: ~15 minutes
- **Runtime Testing**: ~1 hour
- **Total**: ~4 hours

---

## Next Steps After Sprint 2 Sign-Off

1. Tag: `git tag clinical-core-sprint2`
2. Freeze Sprint 2 code (bug fixes only)
3. Begin Sprint 3: Ayurvedic Assessment
4. Link assessment to Visit + Consultation anchor

