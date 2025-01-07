'use client'

import React, { useState, useEffect } from 'react';
import { useAttendanceMarking } from '../hooks/useAttendanceMarking';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, UserCircle2 } from 'lucide-react';

interface AttendanceMarkingProps {
  username?: string;
  onAttendanceMarked: () => void;
}

export function AttendanceMarking({ username, onAttendanceMarked }: AttendanceMarkingProps) {
  const { markAttendance, loading, error, success, attendanceStatus } = useAttendanceMarking(username || '', onAttendanceMarked);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAttendance = (action: 'checkin' | 'checkout') => () => markAttendance(action);

  if (!username) {
    return (
      <Card className="w-full bg-zinc-900/90 backdrop-blur-xl border-zinc-800 shadow-2xl">
        <CardContent className="p-8">
          <h2 className="text-2xl font-light text-zinc-100">Attendance Portal</h2>
          <p className="text-sm text-zinc-400 mt-2">Please sign in to continue</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (attendanceStatus.checkedOut) return 'text-blue-400';
    if (attendanceStatus.checkedIn) return 'text-emerald-400';
    return 'text-zinc-400';
  };

  return (
    <Card className="w-full bg-zinc-900/90 backdrop-blur-xl border-zinc-800 shadow-2xl">
      <CardContent className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100">Attendance Portal</h2>
              <p className="text-sm text-zinc-400 mt-1">{currentTime.toLocaleDateString()}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <UserCircle2 className={`w-6 h-6 ${getStatusColor()}`} />
            </div>
          </div>

          {/* Time Display */}
          <div className="bg-zinc-800/30 rounded-2xl p-6 border border-zinc-700/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400">Current Time</span>
              <Clock className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-4xl font-light text-zinc-100 tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Status Cards */}
          {!loading && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Check In</span>
                  {attendanceStatus.checkedIn && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="text-lg font-light text-zinc-200 tabular-nums">
                  {attendanceStatus.checkInTime
                    ? new Date(attendanceStatus.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--'}
                </div>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Check Out</span>
                  {attendanceStatus.checkedOut && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="text-lg font-light text-zinc-200 tabular-nums">
                  {attendanceStatus.checkOutTime
                    ? new Date(attendanceStatus.checkOutTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--'}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full bg-zinc-800/50" />
                <Skeleton className="h-12 w-full bg-zinc-800/50" />
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleAttendance('checkin')}
                  disabled={loading || attendanceStatus.checkedIn}
                  className={`w-full h-12 text-sm font-medium transition-all duration-300 ${
                    attendanceStatus.checkedIn
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  {attendanceStatus.checkedIn ? 'Checked In' : 'Check In'}
                </Button>
                <Button
                  onClick={handleAttendance('checkout')}
                  disabled={loading || !attendanceStatus.checkedIn || attendanceStatus.checkedOut}
                  className={`w-full h-12 text-sm font-medium transition-all duration-300 ${
                    attendanceStatus.checkedOut
                      ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                      : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
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
                className="mt-6"
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
  );
}

