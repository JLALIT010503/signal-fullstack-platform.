import { NextResponse } from 'next/server';
import { loadDatabaseState } from '@/lib/db/repository';
import { getAllIntegrationStatuses } from '@/lib/integrations/adapters';

export async function GET() {
  const state = loadDatabaseState();
  const totalProspects = state.prospects.length;
  const syntheticProspects = state.prospects.filter((p) => p.is_synthetic).length;
  const liveProspects = state.prospects.filter((p) => !p.is_synthetic).length;
  const hotProspects = state.prospects.filter((p) => p.current_tier === 'HOT').length;
  const qualifiedProspects = state.prospects.filter((p) => p.current_composite_score >= 58).length;
  const pendingFollowups = state.followup_tasks.filter((t) => t.status === 'PENDING').length;
  const counsellorEscalations = state.prospects.filter((p) => p.lifecycle_stage === 'COUNSELLOR_ESCALATED').length;

  const languageDistribution = state.prospects.reduce((acc, p) => {
    acc[p.preferred_language] = (acc[p.preferred_language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourcePerformance = state.prospects.reduce((acc, p) => {
    const src = p.utm_source || 'direct';
    if (!acc[src]) {
      acc[src] = { count: 0, avg_score: 0, hot_count: 0 };
    }
    acc[src].count += 1;
    acc[src].avg_score = Math.round((acc[src].avg_score * (acc[src].count - 1) + p.current_composite_score) / acc[src].count);
    if (p.current_tier === 'HOT') acc[src].hot_count += 1;
    return acc;
  }, {} as Record<string, { count: number; avg_score: number; hot_count: number }>);

  return NextResponse.json({
    success: true,
    data: {
      kpis: {
        total_prospects: totalProspects,
        synthetic_prospects: syntheticProspects,
        live_execution_prospects: liveProspects,
        qualified_prospects: qualifiedProspects,
        high_intent_hot_prospects: hotProspects,
        pending_followups: pendingFollowups,
        counsellor_escalations: counsellorEscalations,
        total_agent_runs: state.agent_runs.length,
        total_tool_calls: state.agent_tool_calls.length,
      },
      language_distribution: languageDistribution,
      source_performance: sourcePerformance,
      experiments: state.experiments,
      integrations: getAllIntegrationStatuses(),
    },
  });
}
