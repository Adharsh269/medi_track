-- 1. Organizations
CREATE TABLE public.organizations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User profiles
-- Authentication credentials remain in Supabase auth.users.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id)
        ON DELETE CASCADE,
    organization_id BIGINT
        REFERENCES public.organizations(id)
        ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK (role IN ('patient', 'caretaker', 'org_admin')),
    phone TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_organization
    ON public.profiles(organization_id);

-- 3. Professional caretaker assignments
-- Keep revoked records to preserve assignment history.
CREATE TABLE public.caretaker_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL
        REFERENCES public.organizations(id) ON DELETE RESTRICT,
    caretaker_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked')),
    CHECK (caretaker_id <> patient_id),
    CHECK (
        (status = 'active' AND revoked_at IS NULL)
        OR
        (status = 'revoked' AND revoked_at IS NOT NULL)
    )
);

-- One active professional caretaker per patient.
CREATE UNIQUE INDEX uq_active_caretaker_per_patient
    ON public.caretaker_assignments(patient_id)
    WHERE status = 'active';

CREATE INDEX idx_assignments_caretaker
    ON public.caretaker_assignments(caretaker_id, status);

CREATE INDEX idx_assignments_patient
    ON public.caretaker_assignments(patient_id, status);