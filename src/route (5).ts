import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';
import { ingestWebpageViaFirecrawl } from '@/lib/integrations/adapters';

export async function POST(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();

  let contentMarkdown = body.content_markdown || '';
  let sourceTitle = body.title || 'Verified Programme Knowledge Source';
  let ingestionMode: 'FIRECRAWL_LIVE' | 'MANUAL_VERIFIED_ENTRY' = 'MANUAL_VERIFIED_ENTRY';

  if (!contentMarkdown && body.source_url) {
    const fc = await ingestWebpageViaFirecrawl(body.source_url);
    if (fc.markdown) {
      contentMarkdown = fc.markdown;
      sourceTitle = fc.title || sourceTitle;
      ingestionMode = 'FIRECRAWL_LIVE';
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'KNOWLEDGE_UNVERIFIED',
            message: fc.diagnostic,
          },
        },
        { status: 422 }
      );
    }
  }

  const sourceId = crypto.randomUUID();
  const chunkId = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  state.knowledge_sources.unshift({
    id: sourceId,
    title: sourceTitle,
    source_type: body.source_type || 'OFFICIAL_BROCHURE',
    source_url: body.source_url || 'https://admissions.signal-institute.edu/manual-verified',
    programme_code: body.programme_code || 'PGP-AIML',
    verification_status: 'VERIFIED',
    last_crawled_at: now,
    verified_at: now,
    expires_at: expiresAt,
    checksum_sha256: crypto.createHash('sha256').update(contentMarkdown).digest('hex'),
  });

  const newChunk = {
    id: chunkId,
    source_id: sourceId,
    programme_code: (body.programme_code || 'PGP-AIML') as 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT',
    programme_name: body.programme_name || 'Postgraduate Programme in Applied AI & Machine Learning',
    category: (body.category || 'FAQ') as 'OVERVIEW' | 'ELIGIBILITY' | 'FEES' | 'SCHOLARSHIPS' | 'CURRICULUM' | 'PLACEMENTS' | 'DEADLINES',
    chunk_title: body.chunk_title || sourceTitle,
    content_markdown: contentMarkdown,
    structured_facts: body.structured_facts || {},
    source_title: sourceTitle,
    source_url: body.source_url || 'https://admissions.signal-institute.edu/manual-verified',
    verified_at: now,
    expires_at: expiresAt,
  };

  state.programme_knowledge.unshift(newChunk);
  saveDatabaseState(state);

  return NextResponse.json({
    success: true,
    data: {
      ingestion_mode: ingestionMode,
      source_id: sourceId,
      chunk: newChunk,
    },
  }, { status: 201 });
}
