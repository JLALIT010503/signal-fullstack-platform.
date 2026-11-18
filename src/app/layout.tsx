import React from 'react';
import './globals.css';

export const metadata = {
  title: 'SIGNAL — Student Intelligence, Guidance & Nurturing Agent Layer',
  description: 'Autonomous Student Acquisition, Qualification, Engagement & Conversion Intelligence Platform',
  icons: {
    icon: '/tab-icon.jpg?v=3',
    shortcut: '/tab-icon.jpg?v=3',
    apple: '/tab-icon.jpg?v=3',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070B14] text-slate-100 antialiased selection:bg-violet-500/30">
        {children}
      </body>
    </html>
  );
}
