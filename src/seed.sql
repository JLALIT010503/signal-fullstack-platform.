-- ============================================================================
-- SIGNAL Synthetic Demonstration Seed Data (supabase/seed.sql)
-- ============================================================================

INSERT INTO public.counsellor_users (id, full_name, email, role, languages_spoken, specializations, active_capacity, current_active_load, is_online)
VALUES
  ('a1111111-1111-4111-8111-111111111101', 'Priya Sharma', 'priya.sharma@signal-institute.edu', 'COUNSELLOR', ARRAY['en', 'hi', 'hinglish'], ARRAY['PGP-AIML', 'BTECH-AIDS'], 40, 14, true),
  ('a1111111-1111-4111-8111-111111111102', 'Rohan Deshmukh', 'rohan.deshmukh@signal-institute.edu', 'COUNSELLOR', ARRAY['en', 'hi', 'hinglish'], ARRAY['EMBA-DT', 'PGP-AIML'], 35, 11, true),
  ('a1111111-1111-4111-8111-111111111103', 'Ananya Iyer', 'ananya.iyer@signal-institute.edu', 'COUNSELLOR', ARRAY['en', 'ta', 'te'], ARRAY['BTECH-AIDS', 'PGP-AIML'], 40, 9, true),
  ('a1111111-1111-4111-8111-111111111104', 'Vikram Nair', 'vikram.nair@signal-institute.edu', 'ADMIN', ARRAY['en', 'hi'], ARRAY['PGP-AIML', 'BTECH-AIDS', 'EMBA-DT'], 20, 3, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.experiments (id, code, name, hypothesis, target_segment, status, variants, metrics_summary)
VALUES
  (
    'e1111111-1111-4111-8111-111111111101',
    'EXP-2026-EMI-FIRST',
    'Monthly No-Cost EMI Framing vs Full Lump-Sum Fee Disclosure',
    'Leading with INR 15,417/mo 12-month no-cost EMI + Scholarship Aptitude Test increases APPLICATION_STARTED rate by >= 25% for FEE_ANXIETY leads.',
    'Prospects with detected barrier FEE_ANXIETY',
    'RUNNING',
    '[{"name": "CONTROL_LUMP_SUM", "traffic_split": 0.5}, {"name": "TREATMENT_EMI_FIRST", "traffic_split": 0.5}]'::JSONB,
    '{"control_conversions": 18, "control_trials": 190, "treatment_conversions": 34, "treatment_trials": 195, "relative_lift_pct": 84.1}'::JSONB
  )
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.knowledge_sources (id, title, source_type, source_url, programme_code, version_tag, verification_status, verified_by, checksum_sha256)
VALUES
  (
    'b1111111-1111-4111-8111-111111111101',
    'PGP in Applied AI & Machine Learning — Official Prospectus 2026-27',
    'OFFICIAL_BROCHURE',
    'https://admissions.signal-institute.edu/pgp-aiml/prospectus-2026',
    'PGP-AIML',
    '2026.2',
    'VERIFIED',
    'a1111111-1111-4111-8111-111111111104',
    '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'
  ),
  (
    'b1111111-1111-4111-8111-111111111102',
    'B.Tech in Artificial Intelligence & Data Science — Admissions & Fee Handbook 2026',
    'FEE_SCHEDULE',
    'https://admissions.signal-institute.edu/btech-aids/handbook-2026',
    'BTECH-AIDS',
    '2026.1',
    'VERIFIED',
    'a1111111-1111-4111-8111-111111111104',
    '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.programme_knowledge (id, source_id, programme_code, programme_name, category, chunk_title, content_markdown, structured_facts)
VALUES
  (
    '11111111-2222-4333-8444-555555555501',
    'b1111111-1111-4111-8111-111111111101',
    'PGP-AIML',
    'Postgraduate Programme in Applied AI & Machine Learning',
    'ELIGIBILITY',
    'Academic Eligibility & Zero-Cost 3-Week Python Foundations Bridge',
    'Candidates holding a Bachelor degree in any quantitative discipline (B.Tech, B.E., B.Sc, B.Com, BCA, BBA, or Economics) with >= 55% aggregate marks are eligible. Non-CS candidates complete a mandatory 3-week Python & Linear Algebra Foundations Bridge at zero additional fee.',
    '{"min_percentage": 55, "non_cs_eligible": true, "bridge_duration_weeks": 3, "bridge_extra_cost_inr": 0}'::JSONB
  ),
  (
    '11111111-2222-4333-8444-555555555502',
    'b1111111-1111-4111-8111-111111111101',
    'PGP-AIML',
    'Postgraduate Programme in Applied AI & Machine Learning',
    'FEES',
    'Tuition Fee Structure, 12-Month No-Cost EMI & Merit Scholarships',
    'Total programme tuition is INR 1,85,000 (inclusive of GST). Admission registration deposit is INR 15,000. 12-month no-cost EMI starts at INR 15,417/month via approved financing partners. Merit scholarships up to 25% (up to INR 46,250 waiver) are awarded to candidates scoring >= 80% on the National AI Aptitude Assessment.',
    '{"total_fee_inr": 185000, "registration_deposit_inr": 15000, "no_cost_emi_12m_inr": 15417, "max_scholarship_pct": 25}'::JSONB
  )
ON CONFLICT (id) DO NOTHING;
