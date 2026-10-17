-- 7. Notifications
-- One notification represents an event to be delivered.
CREATE TABLE public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    dose_log_id BIGINT
        REFERENCES public.dose_logs(id) ON DELETE SET NULL,
    type TEXT NOT NULL
        CHECK (
            type IN ('reminder', 'missed_alert', 'refill_alert')
        ),
    channel TEXT NOT NULL DEFAULT 'whatsapp'
        CHECK (channel IN ('whatsapp', 'web', 'email')),
    message TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    provider_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_pending
    ON public.notifications(status, scheduled_time);

CREATE INDEX idx_notifications_patient
    ON public.notifications(patient_id, created_at DESC);

-- 8. Notification recipients
-- Each row targets either a registered user or a family contact.
CREATE TABLE public.notification_recipients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    notification_id BIGINT NOT NULL
        REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    family_contact_id BIGINT
        REFERENCES public.patient_family_contacts(id)
        ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    UNIQUE (notification_id, user_id),
    UNIQUE (notification_id, family_contact_id),
    CHECK (
        (user_id IS NOT NULL AND family_contact_id IS NULL)
        OR
        (user_id IS NULL AND family_contact_id IS NOT NULL)
    )
);

CREATE INDEX idx_notification_recipients_user
    ON public.notification_recipients(user_id);

CREATE INDEX idx_notification_recipients_family
    ON public.notification_recipients(family_contact_id);

-- 9. Adherence scores
CREATE TABLE public.adherence_scores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    adherence_percentage NUMERIC(5,2),
    risk_flag TEXT
        CHECK (risk_flag IN ('low', 'medium', 'high')),
    model_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date),
    CHECK (
        adherence_percentage IS NULL
        OR adherence_percentage BETWEEN 0 AND 100
    )
);

CREATE INDEX idx_adherence_patient_period
    ON public.adherence_scores(patient_id, end_date DESC);
-- 4. Patient family contacts
-- Family contacts do not need professional user accounts.
CREATE TABLE public.patient_family_contacts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_contacts_patient
    ON public.patient_family_contacts(patient_id, active);

-- 5. Medications
CREATE TABLE public.medications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    times TIME[] NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    pills_remaining INTEGER,
    refill_threshold INTEGER NOT NULL DEFAULT 5,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date IS NULL OR end_date >= start_date),
    CHECK (pills_remaining IS NULL OR pills_remaining >= 0),
    CHECK (refill_threshold >= 0),
    CHECK (cardinality(times) > 0)
);

CREATE INDEX idx_medications_patient_active
    ON public.medications(patient_id, active);

-- 6. Individual scheduled dose records
CREATE TABLE public.dose_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medication_id BIGINT NOT NULL
        REFERENCES public.medications(id) ON DELETE RESTRICT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending', 'taken', 'skipped', 'missed', 'snoozed'
            )
        ),
    actual_time_taken TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    response_source TEXT
        CHECK (response_source IN ('web', 'whatsapp')),
    responded_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (medication_id, scheduled_time),
    CHECK (
        status <> 'taken' OR actual_time_taken IS NOT NULL
    )
);

CREATE INDEX idx_dose_logs_status_time
    ON public.dose_logs(status, scheduled_time);