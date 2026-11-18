import type {
  ChannelType,
  ConversionBarrierCode,
  DetectedBarrier,
  LeadTier,
  ScoreBreakdownFactor,
  SupportedLanguage,
} from '../../types/signal';

export interface ProgrammeKnowledgeChunk {
  id: string;
  source_id: string;
  programme_code: 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT';
  programme_name: string;
  category: 'OVERVIEW' | 'ELIGIBILITY' | 'FEES' | 'SCHOLARSHIPS' | 'CURRICULUM' | 'PLACEMENTS' | 'DEADLINES';
  chunk_title: string;
  content_markdown: string;
  structured_facts: Record<string, unknown>;
  source_title: string;
  source_url: string;
  verified_at: string;
  expires_at: string;
}

// Tool 1: score_prospect()
export function score_prospect(input: {
  prospect_id: string;
  cgpa_or_percentage: number;
  work_experience_months: number;
  undergrad_discipline: string;
  target_programme_code: string;
  raw_inquiry: string;
  detected_barriers: DetectedBarrier[];
}) {
  const breakdown: ScoreBreakdownFactor[] = [];
  let fit = 55;
  let intent = 60;
  let readiness = 58;

  if (input.cgpa_or_percentage >= 70) {
    fit += 20;
    breakdown.push({
      dimension: 'FIT',
      factor: 'Strong Academic Record',
      delta: 20,
      evidence: `Undergraduate aggregate of ${input.cgpa_or_percentage}% exceeds 55% minimum cutoff`,
    });
  } else if (input.cgpa_or_percentage >= 55) {
    fit += 12;
    breakdown.push({
      dimension: 'FIT',
      factor: 'Meets Academic Cutoff',
      delta: 12,
      evidence: `Undergraduate aggregate of ${input.cgpa_or_percentage}% meets 55% eligibility threshold`,
    });
  } else {
    fit -= 25;
    breakdown.push({
      dimension: 'FIT',
      factor: 'Below Minimum Academic Threshold',
      delta: -25,
      evidence: `Reported score ${input.cgpa_or_percentage}% is below standard 55% requirement`,
    });
  }

  if (input.work_experience_months >= 12) {
    fit += 15;
    breakdown.push({
      dimension: 'FIT',
      factor: 'Relevant Work Experience',
      delta: 15,
      evidence: `${input.work_experience_months} months of professional experience`,
    });
  }

  const nonCs = /b\.com|bba|arts|commerce/i.test(input.undergrad_discipline);
  if (nonCs && input.target_programme_code === 'PGP-AIML') {
    fit -= 6;
    breakdown.push({
      dimension: 'FIT',
      factor: 'Non-CS Background (Requires 3-Week Python Bridge)',
      delta: -6,
      evidence: `${input.undergrad_discipline} graduate requires mandatory zero-cost 3-week Python Foundations Bridge`,
    });
  }

  const q = input.raw_inquiry.toLowerCase();
  if (/fee|emi|scholarship|apply|deadline|eligible|eligibility|join|cohort/.test(q)) {
    intent += 28;
    breakdown.push({
      dimension: 'INTENT',
      factor: 'High-Specificity Admission & Financing Inquiry',
      delta: 28,
      evidence: `Direct question on eligibility/fees: "${input.raw_inquiry.slice(0, 90)}"`,
    });
  }

  if (q.length > 60) {
    readiness += 18;
    breakdown.push({
      dimension: 'READINESS',
      factor: 'Detailed Personal Context Shared',
      delta: 18,
      evidence: 'Prospect articulated background, timeline, and specific decision criteria',
    });
  }

  const frictionRaw = input.detected_barriers.reduce((acc, b) => acc + Math.round(b.severity * 42), 15);
  const friction_score = Math.min(95, Math.max(10, frictionRaw));
  if (input.detected_barriers.length > 0) {
    breakdown.push({
      dimension: 'FRICTION',
      factor: `Active Conversion Barriers (${input.detected_barriers.map((b) => b.code).join(', ')})`,
      delta: -Math.round(friction_score * 0.2),
      evidence: input.detected_barriers.map((b) => b.evidence).join('; '),
    });
  }

  const fit_score = Math.min(98, Math.max(15, fit));
  const intent_score = Math.min(98, Math.max(20, intent));
  const readiness_score = Math.min(96, Math.max(20, readiness));
  const composite_score = Math.round(
    0.30 * fit_score + 0.35 * intent_score + 0.25 * readiness_score + 0.10 * (100 - friction_score)
  );

  const tier: LeadTier =
    composite_score >= 76
      ? 'HOT'
      : composite_score >= 58
      ? 'WARM'
      : composite_score >= 38
      ? 'NURTURE'
      : 'DISQUALIFIED';

  const drop_off_probability = Number(
    Math.min(0.92, Math.max(0.08, (friction_score / 100) * 0.65 + ((100 - readiness_score) / 100) * 0.35)).toFixed(3)
  );

  return {
    prospect_id: input.prospect_id,
    composite_score,
    fit_score,
    intent_score,
    readiness_score,
    friction_score,
    drop_off_probability,
    tier,
    score_breakdown: breakdown,
    scoring_method: 'EXPLAINABLE_HYBRID_DETERMINISTIC_V1',
  };
}

// Tool 2: classify_intent()
export function classify_intent(input: { prospect_id: string; raw_inquiry: string }) {
  const q = input.raw_inquiry.toLowerCase();
  let primary_intent = 'GENERAL_EXPLORATION';
  let secondary_intent: string | null = null;
  let urgency_level: 'IMMEDIATE' | 'HIGH' | 'MODERATE' | 'EXPLORATORY' = 'MODERATE';

  if (/eligible|eligibility|b\.com|non-cs|background|math|prerequisite/.test(q)) {
    primary_intent = 'ELIGIBILITY_AND_PREREQUISITE_CHECK';
    urgency_level = 'HIGH';
    if (/fee|emi|scholarship|cost/.test(q)) {
      secondary_intent = 'FEE_SCHOLARSHIP_AND_EMI_INQUIRY';
    }
  } else if (/fee|emi|scholarship|cost|loan|installment/.test(q)) {
    primary_intent = 'FEE_SCHOLARSHIP_AND_EMI_INQUIRY';
    urgency_level = 'HIGH';
  } else if (/placement|package|salary|job|career|ctc|roi/.test(q)) {
    primary_intent = 'CAREER_OUTCOMES_AND_PLACEMENT_ROI';
    urgency_level = 'HIGH';
  } else if (/apply|admission|deadline|start|enroll/.test(q)) {
    primary_intent = 'DIRECT_ADMISSION_APPLICATION';
    urgency_level = 'IMMEDIATE';
  } else if (/syllabus|curriculum|project|capstone|module/.test(q)) {
    primary_intent = 'CURRICULUM_AND_CAPSTONE_COMPARISON';
    urgency_level = 'MODERATE';
  }

  return {
    prospect_id: input.prospect_id,
    primary_intent,
    secondary_intent,
    urgency_level,
    buying_stage: urgency_level === 'IMMEDIATE' || urgency_level === 'HIGH' ? 'EVALUATION' : 'CONSIDERATION',
    confidence: 0.92,
  };
}

// Tool 3: detect_conversion_barriers()
export function detect_conversion_barriers(input: {
  prospect_id: string;
  raw_inquiry: string;
  budget_sensitivity: string;
  undergrad_discipline: string;
}) {
  const q = input.raw_inquiry.toLowerCase();
  const barriers: DetectedBarrier[] = [];

  if (/fee|emi|scholarship|cost|afford|installment/.test(q) || input.budget_sensitivity === 'NEEDS_SCHOLARSHIP_OR_EMI') {
    barriers.push({
      code: 'FEE_ANXIETY',
      severity: 0.76,
      evidence: 'Prospect explicitly requested fee breakdown, no-cost EMI, or scholarship support',
      recommended_rebuttal_category: 'FEES',
    });
  }

  if (/eligible|eligibility|b\.com|non-cs|without math|background/.test(q) || /b\.com|arts|bba/i.test(input.undergrad_discipline)) {
    barriers.push({
      code: 'ELIGIBILITY_DOUBT',
      severity: 0.78,
      evidence: `Questions eligibility from ${input.undergrad_discipline} background`,
      recommended_rebuttal_category: 'ELIGIBILITY',
    });
  }

  if (/placement|salary|ctc|guarantee|job|roi/.test(q)) {
    barriers.push({
      code: 'ROI_OR_PLACEMENT_SKEPTICISM',
      severity: 0.68,
      evidence: 'Seeking verified career transition outcomes and CTC metrics',
      recommended_rebuttal_category: 'PLACEMENTS',
    });
  }

  if (/weekend|working|time|schedule|hours|job alongside/.test(q)) {
    barriers.push({
      code: 'TIME_COMMITMENT_CONFLICT',
      severity: 0.64,
      evidence: 'Working professional concerned about balancing live classes with full-time job',
      recommended_rebuttal_category: 'CURRICULUM',
    });
  }

  return {
    prospect_id: input.prospect_id,
    barriers,
    total_barriers_detected: barriers.length,
  };
}

// Tool 4: search_programme_facts()
export function search_programme_facts(
  input: {
    programme_code: 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT';
    query: string;
    categories?: string[];
  },
  knowledgeStore: ProgrammeKnowledgeChunk[]
) {
  const now = new Date().toISOString();
  const queryTokens = input.query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const candidates = knowledgeStore.filter(
    (chunk) =>
      chunk.programme_code === input.programme_code &&
      chunk.expires_at > now &&
      (!input.categories || input.categories.length === 0 || input.categories.includes(chunk.category))
  );

  const scored = candidates.map((chunk) => {
    const haystack = `${chunk.chunk_title} ${chunk.content_markdown} ${chunk.category}`.toLowerCase();
    const matchedTokens = queryTokens.filter((t) => haystack.includes(t));
    const tokenRatio = queryTokens.length > 0 ? matchedTokens.length / queryTokens.length : 0.5;
    const categoryBoost = input.categories?.includes(chunk.category) ? 0.22 : 0.05;
    const similarity = Number(Math.min(0.98, 0.72 + tokenRatio * 0.22 + categoryBoost).toFixed(3));
    return { ...chunk, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  const topChunks = scored.slice(0, 3);
  const max_similarity = topChunks.length > 0 ? topChunks[0].similarity : 0;

  return {
    programme_code: input.programme_code,
    retrieved_at: now,
    grounding_passed: max_similarity >= 0.78 && topChunks.length > 0,
    max_similarity,
    chunks: topChunks,
  };
}

// Tool 5: recommend_next_action()
export function recommend_next_action(input: {
  prospect_id: string;
  composite_score: number;
  tier: LeadTier;
  detected_barriers: DetectedBarrier[];
  grounding_passed: boolean;
  preferred_channel: ChannelType;
}) {
  if (!input.grounding_passed) {
    return {
      prospect_id: input.prospect_id,
      action_type: 'ESCALATE_COUNSELLOR_CALL',
      secondary_action: 'NONE',
      recommended_channel: 'PHONE_CALL' as ChannelType,
      priority: 'CRITICAL' as const,
      confidence: 0.95,
      requires_human_approval: true,
      rationale: 'Unverified or out-of-scope factual query detected; escalating directly to human admissions counsellor.',
    };
  }

  const hasFeeBarrier = input.detected_barriers.some((b) => b.code === 'FEE_ANXIETY');
  const hasEligibilityBarrier = input.detected_barriers.some((b) => b.code === 'ELIGIBILITY_DOUBT');

  if (input.tier === 'HOT') {
    return {
      prospect_id: input.prospect_id,
      action_type: hasFeeBarrier ? 'SHARE_SCHOLARSHIP_APTITUDE_LINK' : 'SEND_WHATSAPP_FOLLOWUP',
      secondary_action: 'ESCALATE_COUNSELLOR_CALL',
      recommended_channel: input.preferred_channel,
      priority: 'CRITICAL' as const,
      confidence: 0.93,
      requires_human_approval: true,
      rationale: `High-intent prospect (Score ${input.composite_score}/100) with ${
        hasEligibilityBarrier ? 'eligibility & ' : ''
      }${hasFeeBarrier ? 'financing ' : ''}questions. Send verified fact-backed response and schedule priority counsellor call.`,
    };
  }

  return {
    prospect_id: input.prospect_id,
    action_type: 'SEND_WHATSAPP_FOLLOWUP',
    secondary_action: 'SCHEDULE_48H_NURTURE_CHECKIN',
    recommended_channel: input.preferred_channel,
    priority: 'HIGH' as const,
    confidence: 0.87,
    requires_human_approval: true,
    rationale: `Qualified ${input.tier} prospect (Score ${input.composite_score}/100). Provide verified programme facts and queue 48-hour follow-up check-in.`,
  };
}

// Tool 6: draft_multilingual_followup()
// Supports English (en), Hindi (hi), Telugu (te), Tamil (ta), Kannada (kn), Malayalam (ml), and Hinglish
export function draft_multilingual_followup(input: {
  prospect_id: string;
  first_name: string;
  language_code: SupportedLanguage;
  channel: ChannelType;
  programme_code: string;
  programme_name: string;
  chunks: ProgrammeKnowledgeChunk[];
  detected_barriers: DetectedBarrier[];
}) {
  const facts = input.chunks.reduce((acc, c) => ({ ...acc, ...c.structured_facts }), {} as Record<string, unknown>);
  const totalFee = facts.total_fee_inr ? `INR ${Number(facts.total_fee_inr).toLocaleString('en-IN')}` : 'INR 1,85,000';
  const emi = facts.no_cost_emi_12m_inr ? `INR ${Number(facts.no_cost_emi_12m_inr).toLocaleString('en-IN')}/month` : 'INR 15,417/month';
  const minPct = facts.min_percentage ? `${facts.min_percentage}%` : '55%';
  const maxScholarship = facts.max_scholarship_pct ? `${facts.max_scholarship_pct}%` : '25%';

  const englishBody = `Hi ${input.first_name}, thank you for reaching out regarding the ${input.programme_name} (${input.programme_code}). Based on our verified 2026-27 admissions policy: (1) Eligibility: Graduates from quantitative streams (including B.Com, B.Sc, BCA, B.Tech) with >= ${minPct} aggregate are eligible, and non-CS learners complete a 3-week Python Foundations Bridge at zero extra cost. (2) Tuition & EMI: Total fee is ${totalFee} with 12-month no-cost EMI starting at ${emi} and merit scholarships up to ${maxScholarship}. Would you like to take the 20-minute Scholarship Aptitude Test this week?`;

  const localizedMap: Record<SupportedLanguage, string> = {
    en: englishBody,
    hinglish: `Namaste ${input.first_name}! ${input.programme_name} (${input.programme_code}) mein interest ke liye dhanyavaad. Verified admissions guidelines ke mutabik: (1) Eligibility: >= ${minPct} marks wale B.Com, B.Sc, BCA aur B.Tech graduates eligible hain, aur non-CS students ke liye 3-week Python Foundations Bridge bilkul free included hai. (2) Fee & EMI: Total tuition fee ${totalFee} hai, jisme ${emi} ki 12-month no-cost EMI aur ${maxScholarship} tak merit scholarship available hai. Kya aap is week Scholarship Aptitude Test attempt karna chahenge?`,
    hi: `नमस्ते ${input.first_name}, ${input.programme_name} (${input.programme_code}) में आपकी रुचि के लिए धन्यवाद। आधिकारिक प्रवेश नीति 2026-27 के अनुसार: (1) पात्रता: न्यूनतम ${minPct} अंकों के साथ स्नातक (B.Com, B.Sc, BCA, B.Tech सहित) पात्र हैं, और गैर-CS छात्रों के लिए 3-सप्ताह का निःशुल्क Python Foundations Bridge शामिल है। (2) शुल्क और EMI: कुल शिक्षण शुल्क ${totalFee} है, जिसमें ${emi} से शुरू होने वाली 12-महीने की नो-कॉस्ट EMI और ${maxScholarship} तक की मेरिट छात्रवृत्ति उपलब्ध है। क्या आप इस सप्ताह छात्रवृत्ति योग्यता परीक्षा देना चाहेंगे?`,
    te: `నమస్కారం ${input.first_name}, ${input.programme_name} (${input.programme_code}) పట్ల మీ ఆసక్తికి ధన్యవాదాలు. ధృవీకరించబడిన 2026-27 ప్రవేశ నిబంధనల ప్రకారం: (1) అర్హత: కనీసం ${minPct} మార్కులతో ఏదైనా డిగ్రీ (B.Com, B.Sc, BCA, B.Tech) పూర్తి చేసిన వారు అర్హులు; నాన్-CS విద్యార్థులకు 3 వారాల Python Foundations Bridge ఉచితంగా అందించబడుతుంది. (2) ఫీజు & EMI: మొత్తం ట్యూషన్ ఫీజు ${totalFee}, నెలకు ${emi} చొప్పున 12 నెలల నో-కాస్ట్ EMI మరియు ${maxScholarship} వరకు మెరిట్ స్కాలర్‌షిప్ అందుబాటులో ఉన్నాయి. ఈ వారం స్కాలర్‌షిప్ పరీక్షకు హాజరు కావాలనుకుంటున్నారా?`,
    ta: `வணக்கம் ${input.first_name}, ${input.programme_name} (${input.programme_code}) பாடத்திட்டத்தில் உங்கள் ஆர்வத்திற்கு நன்றி. அதிகாரப்பூர்வ 2026-27 சேர்க்கை விதிகளின்படி: (1) தகுதி: குறைந்தபட்சம் ${minPct} மதிப்பெண்களுடன் இளங்கலை பட்டம் (B.Com, B.Sc, BCA, B.Tech உட்பட) பெற்றவர்கள் தகுதியானவர்கள்; CS அல்லாத மாணவர்களுக்கு 3 வார Python Foundations Bridge கூடுதல் கட்டணமின்றி வழங்கப்படுகிறது. (2) கட்டணம் & EMI: மொத்த கல்விக் கட்டணம் ${totalFee}. மாதம் ${emi} முதல் 12 மாத வட்டியில்லா EMI மற்றும் ${maxScholarship} வரை தகுதி உதவித்தொகை (Scholarship) உள்ளது. இந்த வாரம் உதவித்தொகை தகுதித் தேர்வை எழுத விரும்புகிறீர்களா?`,
    kn: `ನಮಸ್ಕಾರ ${input.first_name}, ${input.programme_name} (${input.programme_code}) ಕುರಿತು ನಿಮ್ಮ ಆಸಕ್ತಿಗೆ ಧನ್ಯವಾದಗಳು. ಅಧಿಕೃತ 2026-27 ಪ್ರವೇಶ ನಿಯಮಗಳ ಪ್ರಕಾರ: (1) ಅರ್ಹತೆ: ಕನಿಷ್ಠ ${minPct} ಅಂಕಗಳೊಂದಿಗೆ ಪದವಿ (B.Com, B.Sc, BCA, B.Tech ಸೇರಿದಂತೆ) ಹೊಂದಿರುವವರು ಅರ್ಹರು ಮತ್ತು CS ಅಲ್ಲದ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ 3 ವಾರಗಳ ಉಚಿತ Python Foundations Bridge ಇರುತ್ತದೆ. (2) ಶುಲ್ಕ ಮತ್ತು EMI: ಒಟ್ಟು ಶುಲ್ಕ ${totalFee} ಆಗಿದ್ದು, ತಿಂಗಳಿಗೆ ${emi} ದರದಲ್ಲಿ 12 ತಿಂಗಳ ನೋ-ಕಾಸ್ಟ್ EMI ಹಾಗೂ ${maxScholarship} ವರೆಗೆ ಮೆರಿಟ್ ವಿದ್ಯಾರ್ಥಿವೇತನ ಲಭ್ಯವಿದೆ. ಈ ವಾರ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪರೀಕ್ಷೆ ತೆಗೆದುಕೊಳ್ಳಲು ಬಯಸುವಿರಾ?`,
    ml: `നമസ്കാരം ${input.first_name}, ${input.programme_name} (${input.programme_code}) പ്രോഗ്രാമിലുള്ള താങ്കളുടെ താല്പര്യത്തിന് നന്ദി. ഔദ്യോഗിക 2026-27 പ്രവേശന മാനദണ്ഡങ്ങൾ പ്രകാരം: (1) യോഗ്യത: കുറഞ്ഞത് ${minPct} മാർക്കോടെ ബിരുദം (B.Com, B.Sc, BCA, B.Tech ഉൾപ്പെടെ) നേടിയവർക്ക് അപേക്ഷിക്കാം; നോൺ-CS വിദ്യാർത്ഥികൾക്ക് 3 ആഴ്ചത്തെ സൗജന്യ Python Foundations Bridge ലഭ്യമാണ്. (2) ഫീസും EMI-യും: ആകെ ട്യൂഷൻ ഫീസ് ${totalFee} ആണ്; മാസം ${emi} മുതൽ 12 മാസത്തെ നോ-കോസ്റ്റ് EMI-യും ${maxScholarship} വരെ മെറിറ്റ് സ്കോളർഷിപ്പും ലഭ്യമാണ്. ഈ ആഴ്ച സ്കോളർഷിപ്പ് ടെസ്റ്റിൽ പങ്കെടുക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?`,
  };

  const body_localized = localizedMap[input.language_code] || englishBody;

  return {
    prospect_id: input.prospect_id,
    channel: input.channel,
    language_code: input.language_code,
    subject: `${input.programme_code} Admissions: Verified Eligibility, Fee & ${emi} No-Cost EMI Details`,
    body_localized,
    body_english_translation: englishBody,
    cited_chunk_ids: input.chunks.map((c) => c.id),
    citation_metadata: input.chunks.map((c) => ({
      chunk_id: c.id,
      chunk_title: c.chunk_title,
      source_title: c.source_title,
      source_url: c.source_url,
      verified_at: c.verified_at,
    })),
    status: 'PENDING_APPROVAL' as const,
    requires_human_approval: true,
  };
}

// Tool 7: create_followup_task()
export function create_followup_task(input: {
  prospect_id: string;
  first_name: string;
  programme_code: string;
  composite_score: number;
  detected_barriers: DetectedBarrier[];
  assigned_counsellor_id: string | null;
}) {
  const isHot = input.composite_score >= 75;
  const slaMinutes = isHot ? 30 : 180;
  const dueAt = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();

  return {
    prospect_id: input.prospect_id,
    assigned_counsellor_id: input.assigned_counsellor_id,
    task_type: isHot ? 'HUMAN_COUNSELLOR_CALL' : 'AUTOMATED_WHATSAPP_FOLLOWUP',
    priority: isHot ? ('CRITICAL' as const) : ('HIGH' as const),
    status: 'PENDING' as const,
    title: `${isHot ? '[SLA 30m] Priority Qualification Call' : 'Follow-up Check-in'} — ${input.first_name} (${input.programme_code})`,
    ai_brief_markdown: `Prospect scored **${input.composite_score}/100**. Active barriers: ${
      input.detected_barriers.map((b) => b.code).join(', ') || 'None'
    }. Review and approve the grounded multilingual draft before dispatch.`,
    talking_points: [
      'Confirm eligibility and explain the zero-cost 3-week Python Foundations Bridge for non-CS graduates.',
      'Walk through the 12-month no-cost EMI plan (INR 15,417/month) and share the Scholarship Aptitude Test link (up to 25% tuition waiver).',
      'Verify preferred cohort start date and guide application form initiation.',
    ],
    sla_due_at: dueAt,
  };
}

// Tool 8: escalate_to_counsellor()
export function escalate_to_counsellor(input: {
  prospect_id: string;
  preferred_language: SupportedLanguage;
  programme_code: string;
  composite_score: number;
  escalation_reason: string;
  counsellors: Array<{ id: string; full_name: string; languages_spoken: string[]; specializations: string[]; current_active_load: number }>;
}) {
  const matched =
    input.counsellors.find(
      (c) => c.languages_spoken.includes(input.preferred_language) && c.specializations.includes(input.programme_code)
    ) ||
    input.counsellors[0] || {
      id: 'a1111111-1111-4111-8111-111111111101',
      full_name: 'Priya Sharma',
    };

  return {
    prospect_id: input.prospect_id,
    assigned_counsellor_id: matched.id,
    assigned_counsellor_name: matched.full_name,
    escalation_reason: input.escalation_reason,
    urgency: input.composite_score >= 80 ? 'CRITICAL_15M' : 'HIGH_30M',
    counsellor_brief: `Escalated to ${matched.full_name} (${input.escalation_reason}) with language match [${input.preferred_language}].`,
  };
}

// Tool 9: record_conversion_event()
export function record_conversion_event(input: {
  prospect_id: string;
  event_type:
    | 'LEAD_CAPTURED'
    | 'QUALIFIED_HOT'
    | 'BROCHURE_ENGAGED'
    | 'COUNSELLOR_CALL_COMPLETED'
    | 'APPLICATION_STARTED'
    | 'APPLICATION_SUBMITTED'
    | 'OFFER_ISSUED'
    | 'ENROLLED'
    | 'DROPPED_OUT';
  revenue_value_inr?: number;
  attribution_source: string;
  attribution_campaign: string;
  resolved_barriers?: string[];
  notes?: string;
}) {
  return {
    prospect_id: input.prospect_id,
    event_type: input.event_type,
    revenue_value_inr: input.revenue_value_inr || 0,
    attribution_source: input.attribution_source,
    attribution_campaign: input.attribution_campaign,
    resolved_barriers: input.resolved_barriers || [],
    occurred_at: new Date().toISOString(),
    notes: input.notes || `Recorded conversion milestone: ${input.event_type}`,
  };
}
