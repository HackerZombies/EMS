'use client'

import React, { useMemo, useState } from "react"
import { format, differenceInMinutes, startOfMonth, endOfMonth } from "date-fns"
import { motion } from "framer-motion"
import { Calendar, Clock, ArrowUpDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Attendance } from "@prisma/client"

interface AttendanceDetailsProps {
  attendanceRecords: Attendance[]
  userName: string
}

interface AttendanceWithDuration extends Attendance {
  duration: string
  status: 'On Time' | 'Late' | 'Early Leave' | 'Absent'
}

export default function AttendanceDetails({ attendanceRecords, userName }: AttendanceDetailsProps) {
  const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM'))

  const processedRecords = useMemo(() => {
    return attendanceRecords.map((record): AttendanceWithDuration => {
      const duration = record.checkInTime && record.checkOutTime
        ? differenceInMinutes(new Date(record.checkOutTime), new Date(record.checkInTime))
        : 0

      let status: AttendanceWithDuration['status'] = 'On Time'
      const checkInHour = record.checkInTime ? new Date(record.checkInTime).getHours() : 0
      const checkOutHour = record.checkOutTime ? new Date(record.checkOutTime).getHours() : 0

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
        status
      }
    })
  }, [attendanceRecords])

  const filteredRecords = useMemo(() => {
    const [year, month] = monthFilter.split('-')
    const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1))
    const endDate = endOfMonth(startDate)

    return processedRecords.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })
  }, [processedRecords, monthFilter])

  const stats = useMemo(() => {
    const total = filteredRecords.length
    const onTime = filteredRecords.filter(r => r.status === 'On Time').length
    const late = filteredRecords.filter(r => r.status === 'Late').length
    const absent = filteredRecords.filter(r => r.status === 'Absent').length

    return { total, onTime, late, absent }
  }, [filteredRecords])

  return (
    <Card className="bg-zinc-900/90 border-zinc-800 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold text-zinc-100">
              Attendance History
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-1">
              Viewing attendance records for {userName}
            </p>
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[180px] bg-zinc-800/50 border-zinc-700/50 text-zinc-300">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(2024, i, 1)
                return (
                  <SelectItem
                    key={i}
                    value={format(date, 'yyyy-MM')}
                    className="text-zinc-300 hover:bg-zinc-700"
                  >
                    {format(date, 'MMMM yyyy')}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Days', value: stats.total, color: 'text-blue-400' },
            { label: 'On Time', value: stats.onTime, color: 'text-emerald-400' },
            { label: 'Late Arrivals', value: stats.late, color: 'text-amber-400' },
            { label: 'Absences', value: stats.absent, color: 'text-red-400' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50"
            >
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <p className={`text-2xl font-light mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No attendance records found for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Check-In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Check-Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {format(new Date(record.date), "EEE, MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {record.checkInTime
                        ? format(new Date(record.checkInTime), "hh:mm a")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {record.checkOutTime
                        ? format(new Date(record.checkOutTime), "hh:mm a")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {record.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${record.status === 'On Time' && 'bg-emerald-400/10 text-emerald-400'}
                        ${record.status === 'Late' && 'bg-amber-400/10 text-amber-400'}
                        ${record.status === 'Early Leave' && 'bg-blue-400/10 text-blue-400'}
                        ${record.status === 'Absent' && 'bg-red-400/10 text-red-400'}
                      `}>
                        {record.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

