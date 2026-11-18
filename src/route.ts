import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadDatabaseState, persistProspectAndRun } from '@/lib/db/repository';
import { executeSupervisorAgentRun } from '@/lib/agent/supervisor';
import { triggerN8nWorkflow } from '@/lib/integrations/adapters';
import type { ProspectRecord, SupportedLanguage, ChannelType } from '@/types/signal';

const PROGRAMME_NAMES: Record<string, string> = {
  'PGP-AIML': 'Postgraduate Programme in Applied AI & Machine Learning',
  'BTECH-AIDS': 'B.Tech in Artificial Intelligence & Data Science',
  'EMBA-DT': 'Executive MBA in Digital Transformation',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier');
  const programme = searchParams.get('programme_code');
  const dataOrigin = searchParams.get('origin'); // 'synthetic' | 'live' | null

  const state = loadDatabaseState();
  let list = state.prospects;
  if (tier) list = list.filter((p) => p.current_tier === tier);
  if (programme) list = list.filter((p) => p.target_programme_code === programme);
  if (dataOrigin === 'synthetic') list = list.filter((p) => p.is_synthetic);
  if (dataOrigin === 'live') list = list.filter((p) => !p.is_synthetic);

  return NextResponse.json({
    success: true,
    data: {
      prospects: list,
      total: list.length,
      synthetic_count: list.filter((p) => p.is_synthetic).length,
      live_execution_count: list.filter((p) => !p.is_synthetic).length,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.first_name || !body.email || !body.phone_e164 || !body.raw_initial_inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'first_name, email, phone_e164, and raw_initial_inquiry are required.',
          },
        },
        { status: 400 }
      );
    }

    const progCode = (body.target_programme_code || 'PGP-AIML') as 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT';
    const newProspect: ProspectRecord = {
      id: crypto.randomUUID(),
      is_synthetic: false, // Real user/API execution record
      first_name: String(body.first_name).trim(),
      last_name: String(body.last_name || '').trim(),
      email: String(body.email).trim().toLowerCase(),
      phone_e164: String(body.phone_e164).trim(),
      preferred_language: (body.preferred_language || 'en') as SupportedLanguage,
      preferred_channel: (body.preferred_channel || 'WHATSAPP') as ChannelType,
      target_programme_code: progCode,
      target_programme_name: PROGRAMME_NAMES[progCode] || PROGRAMME_NAMES['PGP-AIML'],
      lifecycle_stage: 'NEW_INQUIRY',
      current_tier: 'NURTURE',
      current_composite_score: 0,
      fit_score: 0,
      intent_score: 0,
      readiness_score: 0,
      friction_score: 0,
      drop_off_risk_score: 0,
      assigned_counsellor_id: null,
      utm_source: String(body.utm_source || 'direct_web_intake'),
      utm_medium: String(body.utm_medium || 'organic'),
      utm_campaign: String(body.utm_campaign || '2026_admissions'),
      consent_whatsapp: body.consent_whatsapp !== false,
      consent_email: body.consent_email !== false,
      consent_call: body.consent_call !== false,
      city: String(body.city || 'Bengaluru'),
      state_region: String(body.state_region || 'Karnataka'),
      highest_qualification: String(body.highest_qualification || 'B.Com / B.Tech'),
      undergrad_discipline: String(body.undergrad_discipline || 'B.Com'),
      graduation_year: Number(body.graduation_year || 2025),
      cgpa_or_percentage: Number(body.cgpa_or_percentage || 74),
      work_experience_months: Number(body.work_experience_months || 12),
      current_role: String(body.current_role || 'Analyst'),
      career_goal: String(body.career_goal || 'AI/ML Transition'),
      budget_sensitivity: body.budget_sensitivity || 'NEEDS_SCHOLARSHIP_OR_EMI',
      raw_initial_inquiry: String(body.raw_initial_inquiry).trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await triggerN8nWorkflow('NEW_PROSPECT_RECEIVED', {
      prospect_id: newProspect.id,
      email: newProspect.email,
      target_programme_code: newProspect.target_programme_code,
    });

    const state = loadDatabaseState();
    const agentRunResult = await executeSupervisorAgentRun({
      prospect: newProspect,
      trigger_type: 'INBOUND_INQUIRY',
      knowledgeStore: state.programme_knowledge,
      counsellors: state.counsellor_users,
    });

    const persisted = await persistProspectAndRun({
      prospect: newProspect,
      agentRunResult,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...persisted,
        agent_execution: agentRunResult,
      },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AGENT_EXECUTION_ERROR',
          message: err instanceof Error ? err.message : 'Unexpected server error',
        },
      },
      { status: 500 }
    );
  }
}
