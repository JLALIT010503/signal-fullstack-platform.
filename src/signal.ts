export type UserRole = 'ADMIN' | 'COUNSELLOR' | 'GROWTH_ANALYST';

export type LifecycleStage =
  | 'NEW_INQUIRY'
  | 'QUALIFYING'
  | 'NURTURING'
  | 'COUNSELLOR_ESCALATED'
  | 'APPLICATION_STARTED'
  | 'APPLICATION_SUBMITTED'
  | 'OFFER_ISSUED'
  | 'ENROLLED'
  | 'DROPPED_OUT'
  | 'DISQUALIFIED';

export type LeadTier = 'HOT' | 'WARM' | 'NURTURE' | 'DISQUALIFIED';
export type ChannelType = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PHONE_CALL' | 'WEB_CHAT';

export type SupportedLanguage =
  | 'en'        // English
  | 'hi'        // Hindi
  | 'te'        // Telugu
  | 'ta'        // Tamil
  | 'kn'        // Kannada
  | 'ml'        // Malayalam
  | 'hinglish'; // Conversational Hindi-English

export type MessageDeliveryStatus =
  | 'DRAFT_CREATED'
  | 'PENDING_APPROVAL'
  | 'MESSAGE_APPROVED'
  | 'MESSAGE_SUBMITTED'
  | 'MESSAGE_DELIVERED'
  | 'RESPONSE_RECEIVED'
  | 'FAILED'
  | 'BLOCKED_NO_CONSENT';

export type ConversionBarrierCode =
  | 'FEE_ANXIETY'
  | 'ELIGIBILITY_DOUBT'
  | 'TIME_COMMITMENT_CONFLICT'
  | 'ROI_OR_PLACEMENT_SKEPTICISM'
  | 'EMPLOYER_OR_FAMILY_APPROVAL'
  | 'COMPETITOR_COMPARISON'
  | 'TECHNICAL_PREREQUISITE_FEAR'
  | 'DEADLINE_PROCRASTINATION';

export type SpecialistToolName =
  | 'score_prospect'
  | 'classify_intent'
  | 'detect_conversion_barriers'
  | 'search_programme_facts'
  | 'recommend_next_action'
  | 'draft_multilingual_followup'
  | 'create_followup_task'
  | 'escalate_to_counsellor'
  | 'record_conversion_event';

export interface ScoreBreakdownFactor {
  dimension: 'FIT' | 'INTENT' | 'READINESS' | 'FRICTION';
  factor: string;
  delta: number;
  evidence: string;
}

export interface DetectedBarrier {
  code: ConversionBarrierCode;
  severity: number;
  evidence: string;
  recommended_rebuttal_category: string;
}

export interface ProspectRecord {
  id: string;
  is_synthetic: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone_e164: string;
  preferred_language: SupportedLanguage;
  preferred_channel: ChannelType;
  target_programme_code: 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT';
  target_programme_name: string;
  lifecycle_stage: LifecycleStage;
  current_tier: LeadTier;
  current_composite_score: number;
  fit_score: number;
  intent_score: number;
  readiness_score: number;
  friction_score: number;
  drop_off_risk_score: number;
  assigned_counsellor_id: string | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  consent_whatsapp: boolean;
  consent_email: boolean;
  consent_call: boolean;
  city: string;
  state_region: string;
  highest_qualification: string;
  undergrad_discipline: string;
  graduation_year: number;
  cgpa_or_percentage: number;
  work_experience_months: number;
  current_role: string;
  career_goal: string;
  budget_sensitivity: 'LOW' | 'MODERATE' | 'HIGH' | 'NEEDS_SCHOLARSHIP_OR_EMI';
  raw_initial_inquiry: string;
  created_at: string;
  updated_at: string;
}
