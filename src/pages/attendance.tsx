import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth/next'
import isMobileDevice from 'is-mobile'

import { authOptions } from "./api/auth/[...nextauth]"
import prisma from '@/lib/prisma'

import MobileAttendanceLayout from '@/components/attendancelayout'
import { MobileAttendanceMarking } from '@/components/Attendance'
import MobileAttendanceDetails from '@/components/AttendanceDetails'

import { Attendance } from '@prisma/client'

interface AttendancePageProps {
  initialAttendanceRecords: Attendance[]
  user: {
    firstName: string
    lastName: string
    username: string
  } | null
  isMobile: boolean
}

export default function AttendanceMobilePage({
  initialAttendanceRecords,
  user,
  isMobile,
}: AttendancePageProps) {
  const [attendanceUpdates, setAttendanceUpdates] = useState<Attendance[]>(initialAttendanceRecords)
  const ws = useRef<WebSocket | null>(null)

  const handleAttendanceMarked = useCallback(() => {
    console.log('Attendance marked (WebSocket should update)')
  }, [])

  // Initialize WebSocket only if we're on mobile (optional; you can remove the isMobile check if desired)
  useEffect(() => {
    if (!isMobile) return

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    ws.current = new WebSocket(`${protocol}://${window.location.host}/api/socket`)

    ws.current.onopen = () => {
      console.log('WebSocket connection opened')
    }

    ws.current.onmessage = (event) => {
      try {
        const attendanceData: Attendance = JSON.parse(event.data)
        setAttendanceUpdates((prevUpdates) => {
          const existingIndex = prevUpdates.findIndex((item) => item.id === attendanceData.id)
          if (existingIndex > -1) {
            const newUpdates = [...prevUpdates]
            newUpdates[existingIndex] = attendanceData
            return newUpdates
          }
          return [attendanceData, ...prevUpdates].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        })
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.current.onclose = () => {
      console.log('WebSocket connection closed')
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      if (
        ws.current &&
        (ws.current.readyState === WebSocket.OPEN ||
          ws.current.readyState === WebSocket.CONNECTING)
      ) {
        ws.current.close()
      }
    }
  }, [isMobile])

  // Render
  return (
    <MobileAttendanceLayout>
      {/* If not on mobile, show a message. If on mobile, show the attendance UI. */}
      {!isMobile ? (
        <div className="mt-6 p-4 rounded-md bg-zinc-800 border border-zinc-700 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            This page is only accessible on a smartphone!
          </h2>
          <p className="text-zinc-300">
            Please open this application on your mobile device to record attendance.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {user && (
            <MobileAttendanceMarking
              username={user.username}
              onAttendanceMarked={handleAttendanceMarked}
            />
          )}
          <MobileAttendanceDetails
            attendanceRecords={attendanceUpdates}
            userName={user?.username || ''}
          />
        </div>
      )}
    </MobileAttendanceLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // 1. Check if user is logged in
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session?.user?.username) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  // 2. Use is-mobile to detect if user is on a mobile device
  const userAgent = context.req.headers['user-agent'] || ''
  const isMobile = isMobileDevice({ ua: userAgent })

  // 3. If user is on mobile, fetch attendance data. Otherwise, show an empty set or placeholders
  let attendanceRecords: Attendance[] = []
  let user = null

  if (isMobile) {
    try {
      attendanceRecords = await prisma.attendance.findMany({
        where: {
          userUsername: session.user.username,
        },
        orderBy: {
          date: 'desc',
        },
      })

      user = await prisma.user.findUnique({
        where: {
          username: session.user.username,
        },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      })
    } catch (error) {
      console.error('Error fetching attendance data:', error)
    }
  }

  return {
    props: {
      isMobile,
      initialAttendanceRecords: JSON.parse(JSON.stringify(attendanceRecords)),
      user: user || null,
    },
  }
}
