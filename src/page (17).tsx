import React from 'react';
import { loadDatabaseState } from '@/lib/db/repository';
import { getAllIntegrationStatuses } from '@/lib/integrations/adapters';
import { SignalWorkspace } from '@/components/SignalWorkspace';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const state = loadDatabaseState();
  const integrations = getAllIntegrationStatuses();
  return (
    <SignalWorkspace
      initialState={state}
      integrations={integrations}
      initialScreen="engagement"
    />
  );
}
