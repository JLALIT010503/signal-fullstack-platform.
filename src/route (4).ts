import { NextResponse } from 'next/server';
import { loadDatabaseState } from '@/lib/db/repository';
import { search_programme_facts } from '@/lib/agent/tools';

export async function POST(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();
  const result = search_programme_facts(
    {
      programme_code: body.programme_code || 'PGP-AIML',
      query: body.query || '',
      categories: body.categories,
    },
    state.programme_knowledge
  );
  return NextResponse.json({ success: true, data: result });
}
