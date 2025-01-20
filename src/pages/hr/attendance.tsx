'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
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
import { MapPin, Clock, Users, AlertCircle, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

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
    id: string
    username: string
    firstName: string
    lastName: string
    role: string
  }
}

interface AllAttendancePageProps {
  initialAttendance: AttendanceRecord[]
  users: { id: string; username: string; firstName: string; lastName: string; role: string }[]
}

const ITEMS_PER_PAGE = 10

export default function AllAttendancePage({ initialAttendance, users }: AllAttendancePageProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(initialAttendance)
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const socketRef = useRef<WebSocket | null>(null)
  const [isServerReady, setIsServerReady] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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
            console.log('WebSocket server is ready, requesting initial data')
            setIsServerReady(true)
            socketRef.current?.send(JSON.stringify({ type: 'request-all-attendance' }))
          } else if (message.type === 'attendanceUpdate') {
            const updatedRecord = message.payload as Attendance
            const user = users.find(user => user.username === updatedRecord.userUsername)
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
                user: {
                  id: user.id,
                  username: user.username,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role || 'USER', // Use user.role from the users array
                },
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
  }, [users])

  useEffect(() => {
    // Filter attendance data based on selected date and user
    const filtered = attendanceData.filter(record => {
      const recordDate = new Date(record.date)
      const matchesDate = selectedDate ? recordDate.toDateString() === selectedDate.toDateString() : true
      const matchesUser = selectedUser ? record.user.id === selectedUser : true
      return matchesDate && matchesUser
    })
    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page on filter change
  }, [attendanceData, selectedDate, selectedUser])

  const getStatusBadge = (record: AttendanceRecord) => {
    if (!record.checkInTime) {
      return <Badge variant="destructive">Not Checked In</Badge>
    }
    if (record.checkInTime && !record.checkOutTime) {
      return <Badge variant="secondary">Currently Working</Badge>
    }
    return <Badge variant="default">Completed</Badge>
  }

  const handleExport = () => {
    const dataToExport = filteredData.map(record => ({
      ID: record.id,
      Date: new Date(record.date).toLocaleDateString(),
      'Check-In Time': record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A',
      'Check-Out Time': record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A',
      'Check-In Location': record.checkInLatitude && record.checkInLongitude ? `${record.checkInLatitude}, ${record.checkInLongitude}` : 'N/A',
      'Check-Out Location': record.checkOutLatitude && record.checkOutLongitude ? `${record.checkOutLatitude}, ${record.checkOutLongitude}` : 'N/A',
      User: `${record.user.firstName} ${record.user.lastName}`,
      Role: record.user.role,
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' })
    const filenameParts = []
    if (selectedDate) {
      filenameParts.push(selectedDate.toISOString().split('T')[0])
    }
    if (selectedUser) {
      const user = users.find(user => user.id === selectedUser)
      if (user) {
        filenameParts.push(user.username)
      }
    }
    const filename = filenameParts.length > 0 ? `attendance_${filenameParts.join('_')}.xlsx` : 'attendance.xlsx'
    saveAs(data, filename)
  }

  // Pagination Logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="container mx-auto">
      <Card className="bg-gray-800 text-gray-100">
        <CardHeader className="space-y-1">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">Employee Attendance</CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  setSelectedDate(date)
                }}
                className="px-4 py-2 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                dateFormat="MMMM d, yyyy"
                maxDate={new Date()}
                placeholderText="Select a date"
              />
              <select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value || null)}
                className="px-4 py-2 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.username})
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md w-full md:w-auto"
              >
                <Download className="h-5 w-5" />
                Export Excel
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isServerReady && filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No attendance data available for the selected criteria</p>
              <p className="text-sm text-gray-400">
                Attendance records will appear here once employees start checking in
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-700">
              <Table className="min-w-full">
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
                  {currentItems.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-700">
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/manage/users/user/${record.user.username}`}
                          className="flex items-center gap-2 text-blue-400 hover:underline text-base"
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
                            <Clock className="h-4 w-4 text-gray-400" />
                            {new Date(record.checkInTime).toLocaleTimeString()}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.checkOutTime ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
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
                              className="flex items-center gap-2 text-blue-400 hover:underline text-sm"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>Check-In</span>
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">No Check-In Location</span>
                          )}
                          {record.checkOutLatitude && record.checkOutLongitude ? (
                            <Link
                              href={`https://www.google.com/maps/search/?api=1&query=${record.checkOutLatitude},${record.checkOutLongitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:underline text-sm"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>Check-Out</span>
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">No Check-Out Location</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === totalPages
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user || !["HR", "ADMIN"].includes(session?.user.role)) {
    return {
      redirect: {
        destination: '/unauthorized',
        permanent: false,
      },
    }
  }

  try {
    const [attendanceRecords, userRecords] = await Promise.all([
      prisma.attendance.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true, // Include role here
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true, // Include role here
        },
      }),
    ])

    const attendanceDataForProps: AttendanceRecord[] = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString(),
      checkInTime: record.checkInTime?.toISOString() || null,
      checkOutTime: record.checkOutTime?.toISOString() || null,
      checkInLatitude: record.checkInLatitude,
      checkInLongitude: record.checkInLongitude,
      checkOutLatitude: record.checkOutLatitude,
      checkOutLongitude: record.checkOutLongitude,
      user: {
        id: record.user.id,
        username: record.user.username,
        firstName: record.user.firstName,
        lastName: record.user.lastName,
        role: record.user.role,
      },
    }))

    return {
      props: {
        initialAttendance: attendanceDataForProps,
        users: userRecords,
      },
    }
  } catch (error) {
    console.error('Error fetching attendance data for HR and ADMIN page:', error)
    return {
      props: {
        initialAttendance: [],
        users: [],
      },
    }
  }
}
