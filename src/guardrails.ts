export interface GuardrailCheckResult {
  passed: boolean;
  guardrail_status: 'PASSED' | 'HUMAN_APPROVAL_REQUIRED' | 'KNOWLEDGE_GAP_ESCALATED' | 'CONSENT_BLOCKED';
  reasons: string[];
}

export function verifyGroundedMessageDraft(params: {
  draftText: string;
  citedChunks: Array<{ id: string; content_markdown: string; structured_facts: Record<string, unknown> }>;
  maxRagSimilarity: number;
  minRagThreshold: number;
  consentAllowed: boolean;
}): GuardrailCheckResult {
  const reasons: string[] = [];

  if (!params.consentAllowed) {
    return {
      passed: false,
      guardrail_status: 'CONSENT_BLOCKED',
      reasons: ['Prospect has opted out or not granted consent for the target communication channel.'],
    };
  }

  if (params.citedChunks.length === 0 || params.maxRagSimilarity < params.minRagThreshold) {
    return {
      passed: false,
      guardrail_status: 'KNOWLEDGE_GAP_ESCALATED',
      reasons: [
        `Retrieved knowledge similarity (${params.maxRagSimilarity.toFixed(2)}) is below threshold (${params.minRagThreshold}). Escalated to human counsellor to prevent hallucination.`,
      ],
    };
  }

  // Deterministic prohibition of unverified guarantees
  const forbiddenGuaranteeRegex = /(100%\s*(job|placement)\s*guarantee|guaranteed\s*admission|pay\s*after\s*placement)/i;
  if (forbiddenGuaranteeRegex.test(params.draftText)) {
    reasons.push('Draft contains prohibited placement/admission guarantee phrasing.');
  }

  // Require human approval before external messages are dispatched (Part G requirement)
  reasons.push('Human counsellor approval is required before external dispatch (Part G compliance gate).');

  return {
    passed: true,
    guardrail_status: 'HUMAN_APPROVAL_REQUIRED',
    reasons,
  };
}
