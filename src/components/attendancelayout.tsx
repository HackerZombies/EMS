import React from 'react'
import Head from 'next/head'

interface LayoutProps {
  children: React.ReactNode
}

export default function MobileAttendanceLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-900">
      <Head>
        <title>EMS - Attendance (Mobile)</title>
        <meta
          name="description"
          content="Employee Management System - Mobile Attendance"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* A narrower container with smaller side padding for mobile */}
      <main className="mx-auto w-full max-w-md px-4 py-4">
        {children}
      </main>
    </div>
  )
}
