'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "../api/auth/[...nextauth]"
import prisma from '@/lib/prisma'
import { Attendance } from '@prisma/client'
import { GetServerSideProps } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type AttendanceRecord = {
  id: string
  date: string
  checkInTime: string | null
  checkOutTime: string | null
  checkInLatitude: number | null
  checkInLongitude: number | null
  checkOutLatitude: number | null
  checkOutLongitude: number | null
  user: {
    username: string
    firstName: string
    lastName: string
    role: string
  }
}

interface AllAttendancePageProps {
  initialAttendance: AttendanceRecord[]
}

export default function AllAttendancePage({ initialAttendance }: AllAttendancePageProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(initialAttendance)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const socketRef = useRef<WebSocket | null>(null)
  const [isServerReady, setIsServerReady] = useState(false); // Add state to track server readiness

  useEffect(() => {
    const connectWebSocket = async () => {
      socketRef.current = new WebSocket(
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/socket`
      )

      socketRef.current.onopen = () => {
        console.log('WebSocket connection opened')
      }

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'serverReady') {
            console.log('WebSocket server is ready, requesting initial data');
            setIsServerReady(true); // Set server readiness to true
            socketRef.current?.send(JSON.stringify({ type: 'request-all-attendance' }));
          } else if (message.type === 'attendanceUpdate') {
            const updatedRecord = message.payload as Attendance
            const user = initialAttendance.find(record => record.user.username === updatedRecord.userUsername)?.user
            if (user) {
              const updatedRecordData: AttendanceRecord = {
                id: updatedRecord.id,
                date: updatedRecord.date.toISOString(),
                checkInTime: updatedRecord.checkInTime?.toISOString() || null,
                checkOutTime: updatedRecord.checkOutTime?.toISOString() || null,
                checkInLatitude: updatedRecord.checkInLatitude,
                checkInLongitude: updatedRecord.checkInLongitude,
                checkOutLatitude: updatedRecord.checkOutLatitude,
                checkOutLongitude: updatedRecord.checkOutLongitude,
                user: user,
              }

              setAttendanceData((prevData) => {
                const existingIndex = prevData.findIndex((item) => item.id === updatedRecord.id)
                if (existingIndex > -1) {
                  const newData = [...prevData]
                  newData[existingIndex] = updatedRecordData
                  return newData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                } else {
                  return [updatedRecordData, ...prevData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                }
              })
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
        }
      }

      socketRef.current.onclose = () => {
        console.log('WebSocket connection closed')
      }

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }

    connectWebSocket()

    return () => {
      socketRef.current?.close()
    }
  }, [initialAttendance])

  const getStatusBadge = (record: AttendanceRecord) => {
    if (!record.checkInTime) {
      return <Badge variant="destructive">Not Checked In</Badge>
    }
    if (record.checkInTime && !record.checkOutTime) {
      return <Badge variant="secondary">Currently Working</Badge>
    }
    return <Badge variant="default">Completed</Badge>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Employee Attendance</CardTitle>
            <Badge variant="secondary" className="text-sm">
              
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : attendanceData.length === 0 && !isServerReady ? ( // Show loading message until server is ready
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <p className="text-lg font-medium">Connecting to real-time updates...</p>
              <p className="text-sm text-muted-foreground">
                Waiting for the server to be ready.
              </p>
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No attendance data available</p>
              <p className="text-sm text-muted-foreground">
                Attendance records will appear here once employees start checking in
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-In</TableHead>
                    <TableHead>Check-Out</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
  <Link
    href={`/manage/users/user/${record.user.username}`}
    className="flex items-center gap-2 text-black hover:underline text-base"
  >
    <Users className="h-5 w-5" />
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
      {record.user.firstName} {record.user.lastName}
    </span>
  </Link>
</TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      <TableCell>
                        {record.checkInTime ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(record.checkInTime).toLocaleTimeString()}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.checkOutTime ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(record.checkOutTime).toLocaleTimeString()}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {record.checkInLatitude && record.checkInLongitude ? (
                            <Link
                              href={`https://www.google.com/maps/search/?api=1&query=${record.checkInLatitude},${record.checkInLongitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline text-sm"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>Check-In</span>
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">No Check-In Location</span>
                          )}
                          {record.checkOutLatitude && record.checkOutLongitude ? (
                            <Link
                              href={`https://www.google.com/maps/search/?api=1&query=${record.checkOutLatitude},${record.checkOutLongitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline text-sm"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>Check-Out</span>
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">No Check-Out Location</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user || session?.user.role !== 'HR') {
    return {
      redirect: {
        destination: '/unauthorized',
        permanent: false,
      },
    }
  }

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    const attendanceDataForProps: AttendanceRecord[] = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString(),
      checkInTime: record.checkInTime?.toISOString() || null,
      checkOutTime: record.checkOutTime?.toISOString() || null,
      checkInLatitude: record.checkInLatitude,
      checkInLongitude: record.checkInLongitude,
      checkOutLatitude: record.checkOutLatitude,
      checkOutLongitude: record.checkOutLongitude,
      user: record.user,
    }))

    return {
      props: {
        initialAttendance: attendanceDataForProps,
      },
    }
  } catch (error) {
    console.error('Error fetching attendance data for HR page:', error)
    return {
      props: {
        initialAttendance: [],
      },
    }
  }
}