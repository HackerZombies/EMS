// src/components/AttendanceDetails.tsx
'use client'

import React, { useMemo, useState } from 'react'
import {
  format,
  differenceInMinutes,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Attendance } from '@prisma/client'

interface MobileAttendanceDetailsProps {
  attendanceRecords: Attendance[]
  userName: string
}

interface AttendanceWithDuration extends Attendance {
  duration: string
  status: 'On Time' | 'Late' | 'Early Leave' | 'Absent'
}

export default function MobileAttendanceDetails({
  attendanceRecords,
  userName,
}: MobileAttendanceDetailsProps) {
  // Filtering is disabled by default.
  const [filterEnabled, setFilterEnabled] = useState<boolean>(false)
  // dateFilter holds a value like "2023-07-15" when filtering is enabled.
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  const processedRecords = useMemo(() => {
    return attendanceRecords.map((record): AttendanceWithDuration => {
      const duration =
        record.checkInTime && record.checkOutTime
          ? differenceInMinutes(
              new Date(record.checkOutTime),
              new Date(record.checkInTime)
            )
          : 0

      let status: AttendanceWithDuration['status'] = 'On Time'
      const checkInHour = record.checkInTime
        ? new Date(record.checkInTime).getHours()
        : 0
      const checkOutHour = record.checkOutTime
        ? new Date(record.checkOutTime).getHours()
        : 0

      if (!record.checkInTime) {
        status = 'Absent'
      } else if (checkInHour >= 9.5) {
        status = 'Late'
      } else if (checkOutHour < 17) {
        status = 'Early Leave'
      }

      return {
        ...record,
        duration: duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : '-',
        status,
      }
    })
  }, [attendanceRecords])

  // When filtering is enabled, filter records by the selected day.
  // Otherwise, show all processed records.
  const filteredRecords = useMemo(() => {
    if (!filterEnabled || !dateFilter) {
      return processedRecords
    }
    const selectedDate = new Date(dateFilter)
    const startDate = startOfDay(selectedDate)
    const endDate = endOfDay(selectedDate)

    return processedRecords.filter((record) => {
      const recordDate = new Date(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })
  }, [processedRecords, filterEnabled, dateFilter])

  const stats = useMemo(() => {
    const total = filteredRecords.length
    const onTime = filteredRecords.filter((r) => r.status === 'On Time').length
    const late = filteredRecords.filter((r) => r.status === 'Late').length
    const absent = filteredRecords.filter((r) => r.status === 'Absent').length

    return { total, onTime, late, absent }
  }, [filteredRecords])

  return (
    <Card className="bg-zinc-800 border-zinc-700 text-zinc-200 mt-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-100">
              Attendance History
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-1">
              Viewing attendance records for {userName || 'User'}
            </p>
          </div>
          {filterEnabled ? (
            <div className="flex items-center space-x-2">
              {/* Date Picker Input */}
              <div className="flex items-center bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                <input
                  type="date"
                  value={dateFilter || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-zinc-200 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setFilterEnabled(false)
                  setDateFilter(null)
                }}
                className="text-xs text-zinc-400 underline"
              >
                Exit Filter
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setFilterEnabled(true)
                // Set default to today's date when enabling filter.
                setDateFilter(format(new Date(), 'yyyy-MM-dd'))
              }}
              className="text-xs text-zinc-400 underline"
            >
              Enable Filter
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-400' },
            { label: 'On Time', value: stats.onTime, color: 'text-emerald-400' },
            { label: 'Late', value: stats.late, color: 'text-amber-400' },
            { label: 'Absent', value: stats.absent, color: 'text-red-400' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-700/20 rounded-md p-2 border border-zinc-600"
            >
              <p className="text-xs text-zinc-400">{stat.label}</p>
              <p className={`text-lg font-light mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-4">
            <Clock className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">
              No attendance records found for this period.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-700/20 rounded-md p-3 border border-zinc-600"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-zinc-100">
                    {format(new Date(record.date), 'EEE, MMM d')}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${record.status === 'On Time' && 'bg-emerald-400/10 text-emerald-400'}
                      ${record.status === 'Late' && 'bg-amber-400/10 text-amber-400'}
                      ${record.status === 'Early Leave' && 'bg-blue-400/10 text-blue-400'}
                      ${record.status === 'Absent' && 'bg-red-400/10 text-red-400'}
                    `}
                  >
                    {record.status}
                  </span>
                </div>

                <div className="text-sm flex flex-col space-y-1 text-zinc-200">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Check-In:</span>
                    <span>
                      {record.checkInTime
                        ? format(new Date(record.checkInTime), 'hh:mm a')
                        : '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Check-Out:</span>
                    <span>
                      {record.checkOutTime
                        ? format(new Date(record.checkOutTime), 'hh:mm a')
                        : '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Duration:</span>
                    <span>{record.duration}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
