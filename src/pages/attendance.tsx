'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "./api/auth/[...nextauth]" // Adjust the import path as needed
import prisma from '@/lib/prisma'
import { AttendanceMarking } from '@/components/Attendance'
import AttendanceDetails from '@/components/AttendanceDetails'
import { Attendance } from '@prisma/client'
import Layout from '@/components/attendancelayout' // Assuming you have this layout

const RECORDS_PER_PAGE = 5 // Adjust as needed

interface AttendancePageProps {
  initialAttendanceRecords: Attendance[]
  user: {
    firstName: string
    lastName: string
    username: string
  } | null
}

const AttendancePage: React.FC<AttendancePageProps> = ({
  initialAttendanceRecords = [],
  user,
}) => {
  const [attendanceUpdates, setAttendanceUpdates] = useState<Attendance[]>(
    initialAttendanceRecords
  )
  const [userName, setUserName] = useState('')
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    ws.current = new WebSocket(`${protocol}://${window.location.host}/api/Socket`);
  
    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };
  
    ws.current.onmessage = (event) => {
      // Handle the received message
      try {
        const attendanceData: Attendance = JSON.parse(event.data);
        setAttendanceUpdates((prevUpdates) => {
          const existingIndex = prevUpdates.findIndex(
            (item) => item.id === attendanceData.id
          );
          if (existingIndex > -1) {
            const newUpdates = [...prevUpdates];
            newUpdates[existingIndex] = attendanceData;
            return newUpdates;
          }
          return [attendanceData, ...prevUpdates].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    return () => {
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        ws.current.close();
      }
    };
  }, []);
  const handleAttendanceMarked = useCallback(async () => {
    console.log('Attendance marked (WebSocket should update)')
  }, [])

  return (
    <Layout>
      <div className="space-y-8">
        {user && (
          <AttendanceMarking
            username={user.username}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}
        <AttendanceDetails
          attendanceRecords={attendanceUpdates}
          userName={userName}
        />
      </div>
    </Layout>
  )
}

export default AttendancePage
import { GetServerSidePropsContext } from 'next'; // Import the type

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.username) {
    return {
      redirect: {
        destination: '/', // Redirect to login page
        permanent: false,
      },
    };
  }

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userUsername: session.user.username,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        username: session.user.username,
      },
      select: {
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    return {
      props: {
        initialAttendanceRecords: JSON.parse(JSON.stringify(attendanceRecords)),
        user: user || null,
      },
    };
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return {
      props: {
        initialAttendanceRecords: [],
        user: null,
      },
    };
  }
}
