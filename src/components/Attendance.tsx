'use client'

import React, { useState, useEffect } from 'react'
import { useAttendanceMarking } from '@/hooks/useAttendanceMarking'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, XCircle, Clock, UserCircle2 } from 'lucide-react'

interface MobileAttendanceMarkingProps {
  username?: string
  onAttendanceMarked: () => void
}

export function MobileAttendanceMarking({
  username,
  onAttendanceMarked,
}: MobileAttendanceMarkingProps) {
  const { markAttendance, loading, error, success, attendanceStatus } =
    useAttendanceMarking(username || '', onAttendanceMarked)

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAttendance = (action: 'checkin' | 'checkout') => () =>
    markAttendance(action)

  if (!username) {
    return (
      <Card className="w-full bg-zinc-800 text-zinc-200 border-zinc-700 shadow-lg">
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xl font-medium">Attendance Portal</h2>
          <p className="text-sm text-zinc-400">Please sign in to continue</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = () => {
    if (attendanceStatus.checkedOut) return 'text-blue-400'
    if (attendanceStatus.checkedIn) return 'text-emerald-400'
    return 'text-zinc-400'
  }

  return (
    <Card className="w-full bg-zinc-800 border-zinc-700 shadow-lg">
      <CardContent className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                Attendance Portal
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {currentTime.toLocaleDateString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center">
              <UserCircle2 className={`w-5 h-5 ${getStatusColor()}`} />
            </div>
          </div>

          {/* Time Display */}
          <div className="bg-zinc-700/20 rounded-md p-3 border border-zinc-700 flex justify-between items-center">
            <div className="flex flex-col text-sm">
              <span className="text-zinc-300">Current Time</span>
              <span className="text-lg text-zinc-100 font-light tabular-nums">
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>

          {/* Status Cards */}
          {!loading && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-700/20 rounded-md p-2 border border-zinc-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">Check In</span>
                  {attendanceStatus.checkedIn && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="text-base font-light text-zinc-200 tabular-nums">
                  {attendanceStatus.checkInTime
                    ? new Date(attendanceStatus.checkInTime).toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )
                    : '--:--'}
                </div>
              </div>
              <div className="bg-zinc-700/20 rounded-md p-2 border border-zinc-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">Check Out</span>
                  {attendanceStatus.checkedOut && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="text-base font-light text-zinc-200 tabular-nums">
                  {attendanceStatus.checkOutTime
                    ? new Date(
                        attendanceStatus.checkOutTime
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--'}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-zinc-700/50" />
                <Skeleton className="h-10 w-full bg-zinc-700/50" />
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleAttendance('checkin')}
                  disabled={loading || attendanceStatus.checkedIn}
                  className={`w-full h-10 text-sm transition-all duration-300 ${
                    attendanceStatus.checkedIn
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600/20'
                      : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  {attendanceStatus.checkedIn ? 'Checked In' : 'Check In'}
                </Button>
                <Button
                  onClick={handleAttendance('checkout')}
                  disabled={loading || !attendanceStatus.checkedIn || attendanceStatus.checkedOut}
                  className={`w-full h-10 text-sm transition-all duration-300 ${
                    attendanceStatus.checkedOut
                      ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-600/20'
                      : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  {attendanceStatus.checkedOut ? 'Checked Out' : 'Check Out'}
                </Button>
              </div>
            )}
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                <Alert
                  variant={error ? 'destructive' : 'default'}
                  className={`border ${
                    error
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}
                >
                  {error ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                  <AlertDescription
                    className={error ? 'text-red-400' : 'text-emerald-400'}
                  >
                    {error || success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CardContent>
    </Card>
  )
}
