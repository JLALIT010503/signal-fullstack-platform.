import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export const metadata = {
  title: 'SIGNAL — Student Intelligence, Guidance & Nurturing Agent Layer',
  description: 'Autonomous Student Acquisition, Qualification, Engagement & Conversion Intelligence Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070B14] text-slate-100 antialiased selection:bg-violet-500/30">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
