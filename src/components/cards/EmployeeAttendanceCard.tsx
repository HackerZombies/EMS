// src/components/cards/EmployeeAttendanceCard.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Attendance } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { format, startOfDay, endOfDay } from 'date-fns'

const EmployeeAttendanceCard: React.FC = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch attendance records for the logged-in employee and poll every 10 seconds.
  useEffect(() => {
    if (session && session.user.role === 'EMPLOYEE') {
      const fetchAttendance = async () => {
        try {
          const res = await fetch(
            `/api/attendance/employee?username=${session.user.username}`
          )
          const json = await res.json()
          // Adjust extraction based on API response format.
          const records: Attendance[] = Array.isArray(json)
            ? json
            : (json.attendance || [])
          setAttendanceRecords(records)
        } catch (error) {
          console.error('Error fetching employee attendance:', error)
          setAttendanceRecords([])
        } finally {
          setLoading(false)
        }
      }

      // Initial fetch and then poll every 10 seconds.
      fetchAttendance()
      const intervalId = setInterval(fetchAttendance, 10000)
      return () => clearInterval(intervalId)
    }
  }, [session])

  // Filter attendance to include only records from today and yesterday.
  const filteredRecords = useMemo(() => {
    const today = new Date()
    const startToday = startOfDay(today)
    const endToday = endOfDay(today)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const startYesterday = startOfDay(yesterday)
    const endYesterday = endOfDay(yesterday)

    return attendanceRecords
      .filter((record) => {
        const recordDate = new Date(record.date)
        return (
          (recordDate >= startToday && recordDate <= endToday) ||
          (recordDate >= startYesterday && recordDate <= endYesterday)
        )
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
  }, [attendanceRecords])

  if (!session || session.user.role !== 'EMPLOYEE') {
    return null
  }

  if (loading) {
    return (
      <div className="text-center text-xs p-2 text-gray-500">
        Loading attendance...
      </div>
    )
  }

  return (
    <div
      className="mt-2 p-2 sm:p-4 bg-white dark:bg-gray-900 shadow rounded cursor-pointer hover:shadow-md transition"
      onClick={() => router.push('/attendance')}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
          Recent Attendance
        </h2>
        <span className="text-xs text-blue-600 underline">View More</span>
      </div>
      {filteredRecords.length === 0 ? (
        <p className="text-xs text-gray-500">
          No attendance records for today or yesterday.
        </p>
      ) : (
        <div className="space-y-1">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 pb-1"
            >
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-100">
                  {format(new Date(record.date), 'MMM d, yyyy')}
                </p>
                <p className="text-[10px] text-gray-500">
                  {record.checkInTime
                    ? format(new Date(record.checkInTime), 'hh:mm a')
                    : '--:--'}{' '}
                  -{' '}
                  {record.checkOutTime
                    ? format(new Date(record.checkOutTime), 'hh:mm a')
                    : '--:--'}
                </p>
              </div>
              <div className="mt-1 sm:mt-0 text-[10px] text-gray-600 dark:text-gray-300">
                {!record.checkInTime
                  ? 'Absent'
                  : record.checkOutTime
                  ? 'Complete'
                  : 'Incomplete'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmployeeAttendanceCard
