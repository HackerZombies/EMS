import React from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
      <Head>
        <title>EMS - Attendance</title>
        <meta name="description" content="Employee Management System - Attendance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

